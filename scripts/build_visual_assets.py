"""Original, reusable PBR-style texture maps and chapter photo illustrations."""
from pathlib import Path
from PIL import Image
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
ASSET=ROOT/'public'/'world';ASSET.mkdir(parents=True,exist_ok=True)
rng=np.random.default_rng(46)
n=1024
x,y=np.meshgrid(np.arange(n),np.arange(n),indexing='xy')
# Brushed steel grain + seams + subtle industrial wear.
grains=rng.normal(0,3.2,(n,n)) + rng.normal(0,3,(n,1))
seamx=np.minimum(x%256,256-x%256)
seamy=np.minimum(y%256,256-y%256)
seams=(seamx<3)|(seamy<3)
bolts=((x%256-18)**2+(y%256-18)**2)<32
lines=((x%128)<2)|((y%128)<2)
scratches=(np.sin(x*.07+y*.012)*1.7)
base=np.clip(55+grains+scratches-seams*18-lines*8-bolts*19,0,255)
col=np.zeros((n,n,3),np.uint8)
col[:,:,0]=base*.82
col[:,:,1]=base*.94
col[:,:,2]=base*1.06
Image.fromarray(col).save(ASSET/'floor_albedo.jpg',quality=88,optimize=True)
h=(grains+scratches-seams*35-bolts*6)
dx=np.roll(h,1,axis=1)-np.roll(h,-1,axis=1)
dy=np.roll(h,1,axis=0)-np.roll(h,-1,axis=0)
norm=np.dstack((-dx*.018,-dy*.018,np.ones((n,n))))
norm/=np.maximum(np.linalg.norm(norm,axis=2,keepdims=True),1e-6)
Image.fromarray(np.uint8(np.clip((norm*.5+.5)*255,0,255))).save(ASSET/'floor_normal.jpg',quality=90)
rgh=np.clip(115+rng.normal(0,18,(n,n))+seams*32,30,250).astype('uint8')
Image.fromarray(rgh).save(ASSET/'floor_roughness.jpg',quality=87)
img=Image.open('/mnt/data/a_wide_cinematic_triptych_three_panel_composite_sc.png').convert('RGB')
w,h=img.size
for i,name in enumerate(['mysore','engineering','glasgow']):
    panel=img.crop((int(i*w/3)+4,0,int((i+1)*w/3)-4,h))
    panel.thumbnail((1040,960),Image.Resampling.LANCZOS)
    panel.save(ROOT/'public'/'journey'/f'{name}.webp',quality=87,method=6)
print('generated images and PBR maps')
