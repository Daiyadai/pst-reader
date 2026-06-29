import os,sys,json
import numpy as np
sys.path.insert(0,"/Users/daiyabase/143core/testing projects/persicope/pst-reader/backend")
from services.color_science import compute_deltas
np.seterr(all='ignore')

m=json.load(open("pst_regression_model.json"))
coeffs=np.array(m["poly_coefficients"]); feats=np.array(m["knn_reference_features"]); resid=np.array(m["knn_reference_residuals"])
def polyrow(f): 
    da,dE,dL,ba,aa=f; return [1.0,da,dE,dL,ba,aa,dE**2,da**2,da*ba,dE*ba]
orig=[]
for i in range(len(feats)):
    pst=sum(c*x for c,x in zip(coeffs,polyrow(feats[i])))+resid[i]
    orig.append((feats[i].tolist(),round(float(pst),4),"original","orig"))

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
longyou=[(feat(s,t),gt,"longyou",cat) for cat,rep,src,gt,s,t in L]

def design(X):
    return np.column_stack([np.ones(len(X)),X[:,0],X[:,1],X[:,2],X[:,3],X[:,4],X[:,1]**2,X[:,0]**2,X[:,0]*X[:,3],X[:,1]*X[:,3]])

def predict_from(trainX,trainy,qfeat,k=7):
    X=np.array(trainX); y=np.array(trainy); pX=design(X)
    c,_,_,_=np.linalg.lstsq(pX,y,rcond=None)
    pres=y-pX@c
    fm=X.mean(0); fs=X.std(0); fs[fs==0]=1.0
    f=np.array(qfeat)
    pf=np.array([1.0,f[0],f[1],f[2],f[3],f[4],f[1]**2,f[0]**2,f[0]*f[3],f[1]*f[3]])
    pp=float(pf@c)
    qn=(f-fm)/fs; rn=(X-fm)/fs
    dd=np.sqrt(((rn-qn)**2).sum(1)); nn=np.argsort(dd)[:k]
    w=1.0/(dd[nn]+1e-8); w/=w.sum()
    return round(pp+float(np.sum(w*pres[nn])),2), float(np.max(np.abs(c)))

ALL=orig+longyou
allf=[a[0] for a in ALL]; ally=[a[1] for a in ALL]

# coeff magnitude sanity on full fit
_,cmax=predict_from(allf,ally,allf[0])
print(f"max |poly coefficient| on full 165-fit: {cmax:.3e}  (sane if < ~1e3)\n")

# 1) REGRESSION CHECK: each original held out of the 165-set, predicted -> compare to old LOO 0.0214
print("=== REGRESSION on 129 lab originals (leave-one-out within combined set) ===")
errs=[]
for i,(f,y,src,cat) in enumerate(ALL):
    if src!="original": continue
    tr=[a for j,a in enumerate(ALL) if j!=i]
    p,_=predict_from([a[0] for a in tr],[a[1] for a in tr],f)
    errs.append(abs(p-y))
print(f"  NEW-model LOO MAE on originals: {np.mean(errs):.4f}   (OLD model was 0.0214)")

# 2) FIX DURABILITY: leave-one-REP-out for Longyou (realistic: model has seen the sample type)
print("\n=== Longyou: leave-one-reading-out (model has seen the sample type) ===")
def loo_longyou(removal):
    by={}
    for i,(f,y,src,cat) in enumerate(ALL):
        if src!="longyou": continue
        tr=[a for j,a in enumerate(ALL) if not removal(j,i,cat)]
        p,_=predict_from([a[0] for a in tr],[a[1] for a in tr],f)
        by.setdefault(cat,[]).append(abs(p-y))
    return by
b1=loo_longyou(lambda j,i,cat: j==i)  # leave just this reading out
for cat in ["base1","base2","product","tianba","rawmilk","gea"]:
    print(f"  {cat:9}: {np.mean(b1[cat]):.3f}")
allb1=[e for v in b1.values() for e in v]
print(f"  overall: {np.mean(allb1):.3f}")

# 3) HARD generalization: leave-one-CATEGORY-out (brand-new sample type, conservative)
print("\n=== Longyou: leave-one-CATEGORY-out (brand-new unseen sample type) ===")
b2=loo_longyou(lambda j,i,cat: ALL[j][2]=="longyou" and ALL[j][3]==cat)
for cat in ["base1","base2","product","tianba","rawmilk","gea"]:
    print(f"  {cat:9}: {np.mean(b2[cat]):.3f}")
print(f"  overall: {np.mean([e for v in b2.values() for e in v]):.3f}")
print("\n(OLD model errors for reference: tianba 0.078, rawmilk 0.077, gea 0.058)")
