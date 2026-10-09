"""Build small, versioned browser datasets from documented public source snapshots.
Usage: python3 scripts/build-time-data.py /path/to/downloads
Expected files: noaa.txt, owid.csv, codebook.csv, countries50.json.
Download URLs are retained in the emitted manifest. No network calls during a site build.
"""
import csv, json, sys, hashlib, math
from pathlib import Path
from collections import defaultdict
ROOT=Path(__file__).resolve().parents[1]
raw=Path(sys.argv[1]);out=ROOT/'counting-carbon/data';out.mkdir(exist_ok=True)
retrieved='2026-10-08'
def save(name, data): (out/name).write_text(json.dumps(data,separators=(',',':'),ensure_ascii=False)+'\n')
series=[]
for line in (raw/'noaa.txt').read_text().splitlines():
 if line.strip() and not line.startswith('#'):
  values=line.split();year,ppm=int(values[0]),float(values[1]);assert ppm>0;series.append({'year':year,'ppm':ppm,'uncertainty':float(values[2])})
assert series[0]['year']==1959 and all(b['year']==a['year']+1 for a,b in zip(series,series[1:]))
assert all(b['ppm']>a['ppm'] for a,b in zip(series,series[1:]))
save('atmosphere.json',{'source':'NOAA Global Monitoring Laboratory, Mauna Loa annual mean CO₂','url':'https://gml.noaa.gov/ccgg/trends/data.html','retrieved':retrieved,'units':'ppm','series':series})
rows=list(csv.DictReader((raw/'owid.csv').open()));geo=json.loads((raw/'countries50.json').read_text())
year=max(int(r['year']) for r in rows if r['country']=='World' and r['co2'])
lookup={str(f['properties'][k]):f['properties']['CONTINENT'] for f in geo['features'] for k in ['ISO_A3','ISO_A3_EH','ADM0_A3'] if f['properties'][k]!='-99'}
lookup.update({'BES':'North America','CXR':'Asia','XKX':'Europe'})
countries=[]
for r in rows:
 if int(r['year'])!=year:continue
 iso=r['iso_code'] or ('XKX' if r['country']=='Kosovo' else '')
 if len(iso)!=3:continue
 if iso not in lookup:raise ValueError(('Missing continent',iso,r['country']))
 countries.append({'id':iso,'name':r['country'],'continent':lookup[iso],'annualMt':float(r['co2']) if r['co2'] else None,'year':year})
countries.sort(key=lambda r:r['name'])
byiso={r['id']:r for r in countries};continents=defaultdict(float)
for r in countries:
 if r['annualMt'] is not None:continents[r['continent']]+=r['annualMt']
bunkers=sum(float(r['co2']) for r in rows if int(r['year'])==year and r['country'] in ['International aviation','International shipping'])
reported=float(next(r['co2'] for r in rows if int(r['year'])==year and r['country']=='World'))
computed=sum(continents.values())+bunkers
assert abs(reported-computed)<.1,(computed,reported)
save('emissions.json',{'source':'Global Carbon Budget 2025 via Our World in Data','url':'https://github.com/owid/co2-data','retrieved':retrieved,'year':year,'units':'MtCO₂/yr','scope':'Territorial fossil-fuel and industrial CO₂, excluding land-use change. Global also includes international aviation and shipping, which are not assigned to continents or countries.','countries':countries,'continents':[{'id':c,'name':c,'annualMt':round(v,6),'year':year} for c,v in sorted(continents.items())],'internationalMt':bunkers,'globalMt':round(computed,6),'publishedGlobalMt':reported})
# Ramer–Douglas–Peucker simplification; keep small islands and all countries.
def simplify(points,tol=.08):
 if len(points)<=3:return points
 a,b=points[0],points[-1];dx,dy=b[0]-a[0],b[1]-a[1];den=dx*dx+dy*dy
 def dist(p):
  t=max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/den)) if den else 0
  return math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy)
 i,d=max(((i,dist(p)) for i,p in enumerate(points[1:-1],1)),key=lambda x:x[1])
 return simplify(points[:i+1],tol)[:-1]+simplify(points[i:],tol) if d>tol else [a,b]
def ring(r):
 mid=len(r)//2;s=simplify(r[:mid+1])[:-1]+simplify(r[mid:]);s=r if len(s)<4 else s
 return [[round(x,3),round(y,3)] for x,y in s]
features=[]
for f in geo['features']:
 p=f['properties'];ids=[str(p[k]) for k in ['ISO_A3_EH','ISO_A3','ADM0_A3']];ids=['XKX' if i in ['KOS','XKX'] else i for i in ids]
 iso=next((i for i in ids if i in byiso),next((i for i in ids if i!='-99'),p['ADMIN']))
 g=f['geometry'];coords=g['coordinates'];polys=[coords] if g['type']=='Polygon' else coords
 features.append({'id':iso,'name':byiso.get(iso,{}).get('name',p['ADMIN']),'continent':lookup.get(iso,p['CONTINENT']),'polygons':[[ring(r) for r in poly] for poly in polys]})
save('world-map.json',{'source':'Natural Earth 1:50m Admin 0 countries, simplified 0.08°','url':'https://www.naturalearthdata.com/about/terms-of-use/','features':features})
save('physical-constants.json',{'carbonToCO2':44/12,'gigatonnesCarbonPerPpm':2.124,'gigatonnesCO2PerPpm':2.124*44/12,'daysPerYear':365.25,'source':'Global Carbon Budget 2025, Table 1; 44/12 book mass convention','url':'https://essd.copernicus.org/articles/18/3211/2026/','note':'7.788 GtCO₂/ppm rounds to the book’s 7.8. Mauna Loa is used as a concentration proxy; this is not a carbon-cycle response model.'})
urls={'noaa.txt':'https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_annmean_mlo.txt','owid.csv':'https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv','codebook.csv':'https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-codebook.csv','countries50.json':'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson'}
save('time-data-manifest.json',{'retrieved':retrieved,'sources':[{'file':n,'url':u,'sha256':hashlib.sha256((raw/n).read_bytes()).hexdigest()} for n,u in urls.items()],'continentOverrides':{'BES':'North America','CXR':'Asia','XKX':'Europe'},'notes':['Kosovo uses XKX as an application identifier; OWID has no ISO code for it.','Continent assignments follow Natural Earth, with explicit small-territory overrides.','Global is the country sum plus international aviation/shipping; its rounding difference from OWID is retained.']})
print('Atmosphere',series[0],series[-1]);print('Countries',len(countries),'year',year,'global Mt',computed,'published Mt',reported)
print('Map size', (out/'world-map.json').stat().st_size)
