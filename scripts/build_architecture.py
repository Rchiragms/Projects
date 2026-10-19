"""Generate an original, self-contained architectural GLB with real mesh geometry.
No Blender or paid assets are required. Requires pip install trimesh numpy.
Geometry is batched by physically-based material to keep browser draw calls low.
"""
from pathlib import Path
from collections import defaultdict
import math
import numpy as np
import trimesh
from trimesh.visual.material import PBRMaterial

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public'/'world'/'reactor_facility.glb'
parts=defaultdict(list)

def put(mesh,cat):
    parts[cat].append(mesh)

def box(size,xyz,cat,angle=0,bevel=False):
    m=trimesh.creation.box(extents=size)
    mat=trimesh.transformations.rotation_matrix(angle,[0,1,0]); mat[:3,3]=xyz
    m.apply_transform(mat)
    put(m,cat)

def local_box(size,local,angle,cat):
    x,y,z=local
    c,s=math.cos(angle),math.sin(angle)
    box(size,(x*c+z*s,y,-x*s+z*c),cat,angle)

def cyl(radius,height,xyz,cat,n=20,angle=0):
    m=trimesh.creation.cylinder(radius=radius,height=height,sections=n)
    # trimesh cylinders default along Z; rotate to Y
    t=trimesh.transformations.rotation_matrix(math.pi/2,[1,0,0]); t[:3,3]=xyz
    m.apply_transform(t);put(m,cat)

def torus(r,pipe,xyz,cat,n=64):
    m=trimesh.creation.torus(major_radius=r,minor_radius=pipe,major_sections=n,minor_sections=8)
    t=trimesh.transformations.rotation_matrix(math.pi/2,[1,0,0]);t[:3,3]=xyz
    m.apply_transform(t);put(m,cat)

def radial_box(size,r,a,y,cat):
    local_box(size,(0,y,r),a,cat)

SIX=[i*math.tau/6 for i in range(6)]
# Entire atrium floor and curved circular deck. Floor plate is substantial solid geometry.
cyl(18.45,0.54,(0,-0.32,0),'deck',100)
torus(17.75,0.14,(0,0.02,0),'chrome',100)
torus(13.5,0.04,(0,0.03,0),'blue',100)
torus(9.2,0.12,(0,0.05,0),'chrome',100)
torus(6.2,0.11,(0,0.06,0),'blue',100)
# Steel radial grates, raised plates and concentric technical channels.
for i in range(72):
    a=i*math.tau/72
    for r in (8.2,11.7,15.7):
        radial_box((0.05,0.045,2.1),r,a,0.02,'chrome' if i%4==0 else 'dark')
    if i%3==0:
        radial_box((1.1,0.075,1.8),14.9,a,0.045,'steel')
# No portal blockage: segmented wall leaves opening at 6 corridor angles.
for i in range(96):
    a=(i+.5)*math.tau/96
    if any(abs(math.atan2(math.sin(a-d),math.cos(a-d))) < .19 for d in SIX):continue
    radial_box((1.18,9.7,0.58),18.2,a,4.9,'dark')
    radial_box((1.13,7.7,0.16),17.82,a,4.9,'steel' if i%5 else 'chrome')
    for h in (1.1,3.7,7.7):radial_box((1.12,0.075,0.16),17.68,a,h,'chrome')
    if i%4==0:
        radial_box((0.09,7.5,0.22),17.58,a,4.95,'black')
        radial_box((0.045,1.0,0.12),17.44,a,4.95,'blue')
# Tall ribs follow curvature and support overhead mechanical lattice.
for i in range(36):
    a=i*math.tau/36
    radial_box((0.58,11.7,0.95),17.3,a,5.86,'chrome')
    radial_box((0.18,8.2,0.35),16.82,a,5.2,'black')
    radial_box((0.08,2.6,0.16),16.56,a,7.15,'blue' if i%6 else 'amber')
# Ceiling concentric bulkheads, suspended central assembly.
for r in (7.4,10.8,14.6,18.0):
    torus(r,0.24,(0,11.6,0),'chrome',100)
for i in range(40):
    a=i*math.tau/40
    radial_box((0.20,0.40,7),11.0,a,11.5,'steel' if i%2 else 'dark')
    radial_box((0.08,0.06,3.4),11.0,a,11.24,'blue' if i%4==0 else 'black')
# Upper maintenance walkway with railings, detailed crossmembers.
torus(15.2,0.21,(0,8.1,0),'steel',100)
torus(16.4,0.21,(0,8.1,0),'steel',100)
torus(15.22,0.055,(0,9.15,0),'chrome',100)
torus(16.43,0.055,(0,9.15,0),'chrome',100)
for i in range(64):
    a=i*math.tau/64
    radial_box((0.1,1.5,0.11),15.3,a,8.7,'chrome')
    radial_box((0.16,0.12,1.2),15.8,a,8.2,'dark')
# Central reactor chassis: hardware around the bright animated energy assembly.
cyl(5.0,1.1,(0,0.38,0),'black',80)
cyl(4.6,0.44,(0,1.05,0),'chrome',80)
cyl(3.95,0.45,(0,1.36,0),'dark',80)
for r,y,p,cat in [(5.1,.78,.13,'chrome'),(4.4,1.5,.12,'amber'),(3.5,1.9,.10,'blue'),(2.1,1.9,.11,'chrome')]:torus(r,p,(0,y,0),cat,100)
for i in range(32):
    a=i*math.tau/32
    radial_box((0.23,1.48,0.85),4.72,a,1.5,'chrome')
    radial_box((0.16,0.7,0.64),3.25,a,2.25,'steel')
    radial_box((0.18,0.08,0.6),3.4,a,2.64,'blue' if i%4 else 'amber')
# Machined reactor columns, segmented cylindrical radiation shielding.
for i in range(24):
    a=i*math.tau/24
    radial_box((0.38,5.8,0.55),2.82,a,5.7,'chrome')
    radial_box((0.29,4.9,0.24),2.44,a,5.55,'glass')
    for h in (3.1,4.2,5.3,6.4,7.5):radial_box((0.35,.11,.56),2.95,a,h,'steel')
# Tower caps and crane rings.
for r,y in [(3.45,3.1),(3.6,6.0),(4.2,8.8),(3.3,9.4)]:torus(r,.18,(0,y,0),'chrome',100)
cyl(2.55,.5,(0,9.5,0),'dark',72)
for i in range(12):
    a=i*math.tau/12
    radial_box((0.45,0.42,1.7),3.6,a,9.2,'steel')
# Reactor cables (actual cylinders stretched along vectors, not flat textures).
def rod(a,b,r,cat,n=9):
    va=np.array(a,dtype=float);vb=np.array(b,dtype=float)
    vec=vb-va
    if np.linalg.norm(vec)<1e-5:return
    m=trimesh.creation.cylinder(radius=r,height=np.linalg.norm(vec),sections=n)
    t=trimesh.geometry.align_vectors([0,0,1],vec)
    t[:3,3]=(va+vb)/2
    m.apply_transform(t);put(m,cat)
for i in range(24):
    a=i*math.tau/24
    for y1,y2,r1,r2 in [(1.2,2.8,4.6,3.1),(7.6,9.1,3.0,4.4)]:
        rod((math.sin(a)*r1,y1,math.cos(a)*r1),(math.sin(a+.13)*r2,y2,math.cos(a+.13)*r2),.052,'copper')
# Corridors and actual enclosed sector bays. Each sector has substantial depth.
for i,a in enumerate(SIX):
    is_hostile=i==4
    light='red' if is_hostile else 'blue'
    # Floor and roof of radial passage
    local_box((6.7,.42,15),(0,-.18,23),a,'deck')
    local_box((7.2,.50,15),(0,9.3,23),a,'dark')
    # Left/right corridor walls; ribs and wall inset panels
    for side in (-1,1):
        local_box((.62,9.2,15),(side*3.55,4.55,23),a,'dark')
        local_box((.22,5.8,12),(side*3.18,4.6,23),a,'steel')
        local_box((.18,.14,13),(side*3.1,2.2,23),a,'chrome')
        local_box((.12,.09,12),(side*3.07,7.5,23),a,light)
        local_box((.4,.38,12),(side*3.12,8.0,23),a,'chrome')
        for j in range(7):
            z=16.9+j*1.9
            local_box((.42,9,0.28),(side*3.07,4.5,z),a,'chrome')
            local_box((.09,2.7,0.09),(side*2.95,4.3,z+.3),a,'black')
            local_box((.07,.65,.12),(side*2.91,4.3,z+.3),a,light)
    for j in range(6):
        z=16.9+j*2.4
        local_box((6.4,.4,.38),(0,9.0,z),a,'steel')
        local_box((4.9,.055,.12),(0,8.71,z),a,light)
        local_box((5.3,.04,.055),(0,.035,z),a,'amber' if is_hostile else 'blue')
    # Wider sector chamber beyond corridor. Walls and modular acoustic panels.
    local_box((16,.42,13.5),(0,-.18,35.3),a,'deck')
    local_box((16,.55,13.5),(0,10.3,35.3),a,'dark')
    local_box((16,10.2,.6),(0,5.1,42.0),a,'dark')
    for side in (-1,1):
        local_box((.6,10.2,13.5),(side*7.7,5.1,35.3),a,'dark')
        local_box((.12,7.7,11.0),(side*7.28,4.7,35.4),a,'steel')
        for z in (30,33,36,39):
            local_box((.16,8.3,.3),(side*7.1,5.1,z),a,'chrome')
        local_box((.10,.12,12.5),(side*7.08,2.5,35),a,light)
    for x in (-6.0,-3.0,0,3.0,6.0):
        local_box((.18,.1,11.5),(x,10.0,35.2),a,light if x==0 else 'chrome')
        local_box((.07,.14,11.5),(x,.03,35.2),a,'chrome')
    for x in (-4.5,-1.5,1.5,4.5):
        local_box((2.8,5.1,.2),(x,5.5,41.65),a,'steel')
        local_box((2.45,3.6,.09),(x,5.6,41.48),a,'black')
        local_box((1.9,.08,.10),(x,7.0,41.37),a,light)
    # Dramatic consoles, reactor-sealed machinery and scientific workstations
    for x in (-4.9,4.9):
        local_box((2.3,1.1,1.2),(x,.63,35.3),a,'chrome')
        local_box((2.0,.15,.95),(x,1.28,35.3),a,'black')
        local_box((1.8,1.0,.12),(x,1.87,35.8),a,'glass')
        local_box((1.58,.07,.11),(x,2.24,35.71),a,light)
        for j in range(4):
            local_box((.07,.05,.16),(x-.6+j*.38,1.38,34.91),a,'blue')
    # Monumental sector terminal station, front accessible at radius about 38
    local_box((4.0,1.15,1.5),(0,.65,39.1),a,'steel')
    local_box((3.6,2.5,.3),(0,2.25,39.8),a,'black')
    local_box((3.25,1.95,.12),(0,2.25,39.60),a,'glass')
    local_box((2.8,.1,.18),(0,3.52,39.52),a,light)
    for j in range(13):
        local_box((.12,.09,.11),(-1.8+j*.3,1.29,38.65),a,light)
    # Entrance gate large mechanical hinged pillars
    for side in (-1,1):
        local_box((.75,9.6,.9),(side*3.55,4.8,15.5),a,'chrome')
        local_box((.22,7.2,.2),(side*3.03,4.6,15.44),a,light)
    local_box((7.1,.8,1.2),(0,9.25,15.5),a,'steel')
    local_box((6.4,.12,.4),(0,8.75,15.26),a,light)
    # Service conduits run down ceiling and loop into room
    for side in (-1,1):
        for j in range(13):
            z=17.8+j*1.7
            local_box((.18,.17,1.5),(side*2.4,8.58,z),a,'copper')
    # Room-specific machinery silhouettes
    if i==2: # project bay: suspended industrial robotic frames
        for x in (-3.5,3.5):
            local_box((.65,4.2,.65),(x,2.25,32.5),a,'chrome')
            local_box((1.8,.3,1.8),(x,4.4,32.5),a,'steel')
    if i==4: # hostile ULTRON: barrier-like equipment
        for x in (-5,0,5):
            local_box((1.3,3.7,1.1),(x,2,32.2),a,'black')
            local_box((1.1,.18,1.0),(x,3.75,32.2),a,'red')

materials={
 'dark':('#0a111a',.68,.46),
 'steel':('#364853',.82,.30),
 'chrome':('#697881',.92,.24),
 'deck':('#17212b',.78,.45),
 'black':('#050a10',.35,.23),
 'glass':('#143b4b',.12,.13),
 'blue':('#3ccfff',.12,.22),
 'red':('#ff3848',.10,.30),
 'amber':('#d78f53',.67,.31),
 'copper':('#98654a',.82,.35),
}
scene=trimesh.Scene()
for key,shapes in parts.items():
    print(key, len(shapes), flush=True)
    merged=trimesh.util.concatenate(shapes)
    hexc,metal,rough=materials[key]
    def rgb(s):return list(bytes.fromhex(s.lstrip('#')))+[255]
    mat=PBRMaterial(name=key,baseColorFactor=rgb(hexc),metallicFactor=metal,roughnessFactor=rough,alphaMode='OPAQUE',doubleSided=True)
    merged.visual=trimesh.visual.TextureVisuals(material=mat)
    scene.add_geometry(merged,geom_name=key,node_name=key)
OUT.parent.mkdir(parents=True,exist_ok=True)
OUT.write_bytes(scene.export(file_type='glb'))
print('WROTE',OUT,OUT.stat().st_size)
# Read-back ensures standard GLB that GLTFLoader can parse.
loaded=trimesh.load(OUT,force='scene')
print('VALIDATED GLB:',len(loaded.geometry),'meshes')
