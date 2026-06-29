import os,sys,json,shutil
import numpy as np
sys.path.insert(0,"/Users/daiyabase/143core/testing projects/persicope/pst-reader/backend")
from services.color_science import compute_deltas
np.seterr(all='ignore')
MP="/Users/daiyabase/143core/testing projects/persicope/pst-reader/backend/calibration/pst_regression_model.json"
m=json.load(open(MP))
coeffs=np.array(m["poly_coefficients"]); feats=np.array(m["knn_reference_features"]); resid=np.array(m["knn_reference_residuals"])
def polyrow(f):
    da,dE,dL,ba,aa=f; return [1.0,da,dE,dL,ba,aa,dE**2,da**2,da*ba,dE*ba]
orig=[(feats[i].tolist(), round(float(sum(c*x for c,x in zip(coeffs,polyrow(feats[i])))+resid[i]),4)) for i in range(len(feats))]
exec(open('/tmp/_longyou_data.py').read()) if os.path.exists('/tmp/_longyou_data.py') else None
L=[("base1",1,"p",0.15,(71.7,25.6,-14.8),(89.0,-1.2,3.3)),("base1",1,"i",0.15,(45.7,30.0,-17.5),(70.1,-3.2,3.3)),
("base1",2,"p",0.14,(71.1,20.5,-14.1),(89.5,-0.4,3.2)),("base1",2,"i",0.14,(46.5,26.8,-17.9),(73.9,-2.9,2.4)),
("base1",3,"p",0.12,(71.2,19.4,-12.2),(88.2,-0.2,3.8)),("base1",3,"i",0.12,(46.1,24.7,-17.0),(75.3,-2.9,2.4)),
("base2",1,"p",0.10,(73.1,25.7,-16.4),(86.0,-3.0,-2.1)),("base2",1,"i",0.10,(47.5,31.2,-14.1),(64.5,-4.7,0.7)),
("base2",2,"p",0.10,(72.1,21.6,-14.8),(82.5,-4.5,-3.2)),("base2",2,"i",0.10,(48.9,30.6,-13.7),(62.2,-4.7,-0.4)),
("base2",3,"p",0.10,(73.2,21.6,-14.1),(82.6,-5.8,-2.6)),("base2",3,"i",0.10,(53.8,31.0,-13.8),(65.1,-5.3,-0.7)),
("product",1,"p",0.08,(72.7,25.8,-17.6),(83.3,-3.9,-4.7)),("product",1,"i",0.08,(47.8,30.7,-12.5),(59.9,-5.1,-0.5)),
("product",2,"p",0.07,(73.3,22.0,-15.1),(82.0,-4.9,-4.0)),("product",2,"i",0.07,(49.4,29.4,-13.0),(61.8,-4.8,-1.1)),
("product",3,"p",0.08,(74.0,20.6,-14.5),(83.5,-4.8,-3.3)),("product",3,"i",0.08,(48.2,28.3,-13.1),(60.7,-4.7,-0.4)),
("tianba",1,"p",0.14,(63.1,22.2,-17.5),(85.9,2.8,-0.1)),("tianba",1,"i",0.14,(42.5,27.6,-18.4),(71.1,-1.8,1.7)),
("tianba",2,"p",0.18,(61.4,23.6,-21.8),(85.9,2.9,0.5)),("tianba",2,"i",0.18,(40.1,27.0,-19.6),(71.0,-2.5,2.6)),
("tianba",3,"p",0.19,(64.2,22.3,-17.9),(88.9,1.7,1.7)),("tianba",3,"i",0.19,(42.7,27.3,-19.9),(73.6,-2.4,3.2)),
("rawmilk",1,"p",0.18,(54.7,32.0,-27.6),(87.3,-2.6,1.9)),("rawmilk",1,"i",0.18,(39.7,37.4,-22.7),(77.2,-4.6,1.8)),
("rawmilk",2,"p",0.18,(54.1,31.1,-26.3),(88.8,-0.2,2.7)),("rawmilk",2,"i",0.18,(35.6,34.3,-22.4),(73.8,-3.2,1.3)),
("rawmilk",3,"p",0.19,(51.7,30.9,-30.0),(87.0,1.2,3.2)),("rawmilk",3,"i",0.19,(35.7,34.7,-23.5),(78.0,-2.5,2.5)),
("gea",1,"p",0.14,(53.1,31.5,-25.0),(84.0,-5.9,-1.5)),("gea",1,"i",0.14,(40.7,43.2,-19.8),(71.2,-4.6,-0.4)),
("gea",2,"p",0.14,(56.3,33.2,-26.8),(85.1,-5.7,-0.9)),("gea",2,"i",0.14,(39.2,41.7,-19.6),(71.9,-5.0,0.6)),
("gea",3,"p",0.14,(54.4,30.4,-23.5),(89.3,-3.1,1.2)),("gea",3,"i",0.14,(38.3,40.8,-21.7),(75.4,-4.4,1.3))]
def feat(s,t):
    d=compute_deltas(s,t); return [d["delta_a"],d["delta_E"],d["delta_L"],s[1],t[1]]
longyou=[(feat(s,t),gt) for cat,rep,src,gt,s,t in L]
allf=[a[0] for a in orig]+[a[0] for a in longyou]
ally=[a[1] for a in orig]+[a[1] for a in longyou]
n=len(allf); X=np.array(allf); y=np.array(ally)
pX=np.column_stack([np.ones(n),X[:,0],X[:,1],X[:,2],X[:,3],X[:,4],X[:,1]**2,X[:,0]**2,X[:,0]*X[:,3],X[:,1]*X[:,3]])
c,_,_,_=np.linalg.lstsq(pX,y,rcond=None); pres=y-pX@c
fm=X.mean(0); fs=X.std(0); fs[fs==0]=1.0
# LOO MAE
errs=[]
for i in range(n):
    mask=np.ones(n,bool); mask[i]=False
    lc,_,_,_=np.linalg.lstsq(pX[mask],y[mask],rcond=None); lres=y[mask]-pX[mask]@lc
    lm=X[mask].mean(0); ls=X[mask].std(0); ls[ls==0]=1.0
    qn=(X[i]-lm)/ls; rn=(X[mask]-lm)/ls
    dd=np.sqrt(((rn-qn)**2).sum(1)); nn=np.argsort(dd)[:7]
    w=1.0/(dd[nn]+1e-8); w/=w.sum()
    errs.append(abs(y[i]-(pX[i]@lc+np.sum(w*lres[nn]))))
loo=float(np.mean(errs))
newm=dict(m)
newm.update({"poly_coefficients":c.tolist(),"knn_features_mean":fm.tolist(),"knn_features_std":fs.tolist(),
    "knn_reference_features":X.tolist(),"knn_reference_residuals":pres.tolist(),
    "n_samples":n,"pst_range":[float(y.min()),float(y.max())],"loo_cv_mae":loo,
    "loo_cv_max_error":float(np.max(errs)),"trained_at":"2026-06-29T00:00:00",
    "data_sources":{"original":len(orig),"longyou_yili_2026_06":len(longyou)}})
# backup + write
bk=MP.replace(".json","_backup_pre_longyou.json")
if not os.path.exists(bk): shutil.copy2(MP,bk); print("backed up ->",os.path.basename(bk))
json.dump(newm,open(MP,"w"),indent=2)
print(f"committed: {n} samples, LOO-CV MAE {loo:.4f}, PST range [{y.min():.2f},{y.max():.2f}]")
