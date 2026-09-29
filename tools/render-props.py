"""
The two props, rendered from their .glb files with Blender: the Macintosh
128K for the scene after the film, and the Korean payphone that is LOAD.

    python tools/render-props.py mac              # final: public/program/mac.webp + lib/mac.ts
    python tools/render-props.py phone            # final: public/hero/phone.webp + lib/phone.ts
    python tools/render-props.py phone --preview  # small and quick, to look at (tools/.props/)
    python tools/render-props.py phone --preview --az 90 --tag side

Both are studio renders on nothing: film transparent, a key light, a fill, a
rim and a top light, all area lights sized and placed against the model's own
size, so the same rig lights a 40 cm phone and a 50-unit computer. The world
is nearly dark: the form and the texture come from the lights, and the white
of the page is the page's. The Macintosh stands on a shadow catcher, so its
shadow comes with it in the alpha; the phone hangs on the picture and casts
nothing. The camera is straight on — the computer's screen is a rectangle,
the phone is a front elevation — with a little height on the computer so the
keyboard reads.

Models:
  Macintosh 128K Computer (1984) — Daz, Sketchfab, CC BY-NC 4.0.
  Korean Payphone — Console Art Cybernetic, Sketchfab, Sketchfab Standard licence.

Blender: D:/Tools/Blender/blender-4.5.9-windows-x64/blender.exe, or BLENDER.
The same file runs inside Blender (it imports bpy there) and outside it (it
starts Blender, then crops and encodes what Blender rendered).
"""
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(HERE)
BLENDER = os.environ.get("BLENDER", r"D:\Tools\Blender\blender-4.5.9-windows-x64\blender.exe")
WORK = os.path.join(HERE, ".props")  # Blender's raw renders and what it measured

MODELS = {
    "mac": {
        "glb": r"D:\0.WILDCARD\Website\macintosh_128k_computer_1984.glb",
        "az": 0.0, "el": 6.0, "lens": 50.0,
        "w": 3000, "h": 2000, "out_w": 2400,
        "ground": True,
        "screen": "Computer_Screen",
        "out": os.path.join(SITE, "public", "program", "mac.webp"),
        "src": "/program/mac.webp",
        "ts": os.path.join(SITE, "lib", "mac.ts"),
        "const": "MAC",
        # Plastics with no roughness map import at roughness 1 (glTF's default)
        # and come out flat, like a cut-out. Given a real plastic's roughness
        # they take highlights and gradients again.
        "roughness": {"Computer": 0.42, "Lightplastic": 0.44, "Whiteplastic": 0.4, "Keys": 0.46, "Blackplastic": 0.38},
        # Dim, and three quarters of a stop under, with the fill almost gone:
        # the beige plastics are bright and glossy, and lit evenly they read
        # as a clean drawing, not a thing in a room. The shadows are where
        # it gets its weight. A little more world than the phone's, for the
        # contact shadows under the keyboard and the mouse.
        "lights": {"key": 0.4, "fill": 0.07, "rim": 0.4, "top": 0.15, "exposure": -0.75, "world": 0.08},
        # The screen: black glass that reflects — the lights sit on it as soft
        # highlights, the rest is black. Matte, it was a grey slate.
        "screen_glass": {"roughness": 0.14, "specular": 0.5},
        # Forty years of beige: a touch warmer, a touch less clean.
        "grade": {"brightness": 0.97, "contrast": 1.08, "saturation": 0.92, "tint": (1.02, 1.0, 0.95)},
    },
    "phone": {
        # 1980's Phone — Daz, Sketchfab, CC BY 4.0. A brick of a mobile, the
        # keypad on its narrow face; that face looks along the model's -x,
        # so the front is az 90. Tall and thin, antenna up.
        "glb": r"D:\0.WILDCARD\Website\1980s_phone.glb",
        # Turned a little off the front (20°), so the brick has a side — the
        # right side, the one the sun is on.
        "az": 70.0, "el": 6.0, "lens": 85.0,
        "w": 900, "h": 2600, "out_w": 700,
        "ground": False,
        "screen": None,
        "out": os.path.join(SITE, "public", "hero", "phone.webp"),
        "src": "/hero/phone.webp",
        "ts": os.path.join(SITE, "lib", "phone.ts"),
        "const": "PHONE",
        "roughness": {},
        # The photograph's light, not a studio's: the low sun sits top right
        # of the picture, behind the phone, and the street is in shade. So
        # the key is the sun, warm, from behind and to the right, and lays a
        # hot edge along the phone; the front is the shade, filled by a cool
        # sky from the left; no rim of its own.
        "rig": {
            "key": {"az": 118, "el": 26, "width": 0.9, "color": (1.0, 0.8, 0.58)},
            "fill": {"az": -40, "el": 18, "width": 2.2, "color": (0.74, 0.83, 1.0)},
            "rim": {"az": 175, "el": 45, "width": 0.6, "color": (1.0, 0.88, 0.72)},
            "top": {"az": 0, "el": 80, "width": 1.6, "color": (0.82, 0.88, 1.0)},
        },
        "world_gradient": {"top": 0.45, "bottom": 0.03, "from": (-0.6, 0.8)},
        "lights": {"key": 1.7, "fill": 0.34, "rim": 0.5, "top": 0.22, "exposure": -0.25},
        # Into the picture: darker (the street is in shade), softer, less
        # saturated, warmer in the lights, blacks lifted to the print's, and
        # the print's grain.
        "grade": {"brightness": 0.8, "contrast": 0.94, "saturation": 0.8, "tint": (1.03, 1.0, 0.94), "lift": 12, "grain": 5},
    },
    "payphone": {
        # Retired 2026-09-29 (the 1980's phone took its place). Kept for the
        # steel it was given; it renders into the work folder only.
        "glb": r"D:\0.WILDCARD\Website\korean_payphone.glb",
        "az": 0.0, "el": 0.0, "lens": 70.0,
        "w": 1200, "h": 1750, "out_w": 1000,
        "ground": False,
        "screen": None,
        "out": os.path.join(WORK, "payphone.webp"),
        "src": "/hero/payphone.webp",
        "ts": None,
        "const": "PAYPHONE",
        "roughness": {},
        # The model's textures paint it as pale plastic; the machine is
        # brushed steel with a black handset. Metal is taken from the paint's
        # own brightness — the bright body and stickers become steel, the
        # dark handset and slot stay plastic — the paint is dimmed to a
        # steel's reflectance and brushed sideways, and the world is a
        # studio ceiling, bright above and dark below, for the steel to
        # reflect. Then a cool, quieter grade.
        "steel": {"tint": (0.52, 0.545, 0.59), "gamma": 1.5, "low": 0.2, "high": 0.48, "metallic": 0.95, "anisotropic": 0.7, "roughness_scale": 0.6},
        "world_gradient": {"top": 1.1, "bottom": 0.04, "from": (-0.6, 0.8)},
        "lights": {"key": 1.0, "fill": 0.3, "rim": 0.9, "top": 0.5, "exposure": -0.4},
        "grade": {"brightness": 0.9, "contrast": 1.2, "saturation": 0.6, "tint": (0.96, 0.98, 1.03)},
    },
}


def parse(argv):
    if not argv or argv[0] not in MODELS:
        raise SystemExit("usage: render-props.py mac|phone|payphone [--preview] [--close] [--az deg] [--el deg] [--lens mm] [--tag name]")
    m = MODELS[argv[0]]
    a = {"model": argv[0], "az": m["az"], "el": m["el"], "lens": m["lens"], "w": m["w"], "h": m["h"],
         "samples": 256, "preview": False, "close": False, "tag": "", "key": 1.0, "fill": 0.3, "rim": 0.9, "top": 0.5,
         "world": 0.05, "exposure": 0.0, "margin": 0.08}
    a.update(m.get("lights", {}))
    it = iter(argv[1:])
    for k in it:
        if k == "--preview":
            a["preview"] = True
            a["samples"] = 48
            a["w"], a["h"] = a["w"] // 3, a["h"] // 3
        elif k == "--close":
            # The close plate: the same picture at three times the size,
            # only the part round the screen. See blender_main.
            a["close"] = True
            a["samples"] = 160
            a["tag"] = "close"
        elif k.startswith("--"):
            key = k[2:]
            if key not in a:
                raise SystemExit(f"unknown option {k}")
            v = next(it)
            a[key] = v if isinstance(a[key], str) else type(a[key])(float(v))
    return a


# ── inside Blender ─────────────────────────────────────────────────────────

def blender_main(a):
    import math

    import bpy
    from bpy_extras.object_utils import world_to_camera_view
    from mathutils import Vector

    m = MODELS[a["model"]]
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=m["glb"])
    scene = bpy.context.scene
    meshes = [o for o in scene.objects if o.type == "MESH"]

    pts = [p for o in meshes for p in (o.matrix_world @ Vector(c) for c in o.bound_box)]
    lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    centre = (lo + hi) / 2
    size = hi - lo
    L = size.length

    # The front. glTF's +Z is the front by convention and the importer turns
    # it to Blender's -Y; the Macintosh's screen says so too. Az turns from
    # there, so --az 90 looks at the left side, 180 at the back.
    front = Vector((0, -1, 0))
    up = Vector((0, 0, 1))
    right = front.cross(up).normalized()

    def direction(az_deg, el_deg):
        az = math.radians(az_deg)
        el = math.radians(el_deg)
        return (front * math.cos(az) + right * math.sin(az)) * math.cos(el) + up * math.sin(el)

    # Materials: roughness where the model has none, the screen as dark glass,
    # the phone's paint turned to steel.
    steel = m.get("steel")
    if steel:
        for mat in bpy.data.materials:
            if not mat.use_nodes:
                continue
            nt = mat.node_tree
            bsdf = next((n for n in nt.nodes if n.type == "BSDF_PRINCIPLED"), None)
            if bsdf is None:
                continue
            base = bsdf.inputs["Base Color"]
            if not base.links:
                continue
            paint = base.links[0].from_socket
            # Dim the paint to a steel's reflectance.
            tint = nt.nodes.new("ShaderNodeMix")
            tint.data_type = "RGBA"
            tint.blend_type = "MULTIPLY"
            tint.inputs["Factor"].default_value = 1.0
            tint.inputs[7].default_value = (*steel["tint"], 1.0)  # B (RGBA)
            nt.links.new(paint, tint.inputs[6])  # A (RGBA)
            # ...and push its darks down: the handset and the slot go to
            # black, the stickers stay white.
            gamma = nt.nodes.new("ShaderNodeGamma")
            gamma.inputs["Gamma"].default_value = steel["gamma"]
            nt.links.new(tint.outputs[2], gamma.inputs["Color"])
            nt.links.new(gamma.outputs["Color"], base)
            # Metal where the paint is bright, plastic where it is dark.
            bw = nt.nodes.new("ShaderNodeRGBToBW")
            nt.links.new(paint, bw.inputs["Color"])
            ramp = nt.nodes.new("ShaderNodeMapRange")
            ramp.inputs["From Min"].default_value = steel["low"]
            ramp.inputs["From Max"].default_value = steel["high"]
            ramp.inputs["To Min"].default_value = 0.0
            ramp.inputs["To Max"].default_value = steel["metallic"]
            ramp.clamp = True
            nt.links.new(bw.outputs["Val"], ramp.inputs["Value"])
            metal = bsdf.inputs["Metallic"]
            for link in list(metal.links):
                nt.links.remove(link)
            nt.links.new(ramp.outputs["Result"], metal)
            # Brushed: the highlights smear along the grain, and the paint's
            # roughness is brought down so the steel reflects more than it
            # scatters.
            rough = bsdf.inputs["Roughness"]
            if rough.links and steel.get("roughness_scale"):
                src = rough.links[0].from_socket
                for link in list(rough.links):
                    nt.links.remove(link)
                scale = nt.nodes.new("ShaderNodeMath")
                scale.operation = "MULTIPLY"
                scale.inputs[1].default_value = steel["roughness_scale"]
                nt.links.new(src, scale.inputs[0])
                nt.links.new(scale.outputs["Value"], rough)
            for inp in bsdf.inputs:
                if inp.name == "Anisotropic":
                    inp.default_value = steel["anisotropic"]
                elif inp.name == "Anisotropic Rotation":
                    inp.default_value = 0.0
    for name, rough in m["roughness"].items():
        mat = bpy.data.materials.get(name)
        if mat is None or not mat.use_nodes:
            continue
        bsdf = next((n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED"), None)
        if bsdf is None:
            continue
        inp = bsdf.inputs["Roughness"]
        if not inp.links:
            inp.default_value = rough
    if m["screen"]:
        mat = bpy.data.materials.get("Screen")
        bsdf = next((n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED"), None) if mat else None
        if bsdf is not None:
            for inp in bsdf.inputs:
                if inp.name == "Base Color":
                    for link in list(inp.links):
                        mat.node_tree.links.remove(link)
                    inp.default_value = (0.004, 0.0045, 0.006, 1.0)
                elif inp.name == "Roughness":
                    for link in list(inp.links):
                        mat.node_tree.links.remove(link)
                    inp.default_value = m.get("screen_glass", {}).get("roughness", 0.55)
                elif inp.name in ("Specular IOR Level", "Specular"):
                    inp.default_value = m.get("screen_glass", {}).get("specular", 0.08)
                elif inp.name == "Emission Strength":
                    inp.default_value = 0.0

    if m["ground"]:
        bpy.ops.mesh.primitive_plane_add(size=L * 30, location=(centre.x, centre.y, lo.z))
        ground = bpy.context.active_object
        ground.name = "Ground"
        ground.is_shadow_catcher = True
        # The catcher takes the shadow and gives nothing back: a white floor
        # this size, lit by the rig, would bounce enough light up to wash
        # the model out. The camera sees it (for the shadow); light does not.
        ground.visible_diffuse = False
        ground.visible_glossy = False
        ground.visible_transmission = False

    world = bpy.data.worlds.new("Studio")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs[0].default_value = (1, 1, 1, 1)
    bg.inputs[1].default_value = a["world"]
    grad = m.get("world_gradient")
    if grad:
        # A studio ceiling: bright straight up, dark at the floor, so that
        # metal has something to reflect. The generated coordinate of a
        # world shader is the direction looked in.
        wt = world.node_tree
        coord = wt.nodes.new("ShaderNodeTexCoord")
        xyz = wt.nodes.new("ShaderNodeSeparateXYZ")
        wt.links.new(coord.outputs["Generated"], xyz.inputs["Vector"])
        ramp = wt.nodes.new("ShaderNodeMapRange")
        ramp.inputs["From Min"].default_value = grad["from"][0]
        ramp.inputs["From Max"].default_value = grad["from"][1]
        ramp.inputs["To Min"].default_value = grad["bottom"]
        ramp.inputs["To Max"].default_value = grad["top"]
        ramp.clamp = True
        wt.links.new(xyz.outputs["Z"], ramp.inputs["Value"])
        wt.links.new(ramp.outputs["Result"], bg.inputs[1])

    # The rig. Area lights, each placed on a direction from the model's
    # centre at a distance in its own size, powered for that distance: an
    # area light's power goes as the square of its distance, so `base` is
    # what it would take at one unit, and the numbers hold for any model.
    def area(name, az, el, dist, width, strength, shadow=True, color=(1.0, 1.0, 1.0)):
        data = bpy.data.lights.new(name, "AREA")
        data.shape = "RECTANGLE"
        data.size = width
        data.size_y = width * 0.7
        data.color = color
        d = dist * L
        # 160 W at one unit lights a white diffuse surface to about 0.7;
        # the square law keeps that at any distance, and any model size.
        data.energy = 160.0 * strength * d * d
        # One shadow, the key's. Four lights would lay four on the floor.
        data.use_shadow = shadow
        obj = bpy.data.objects.new(name, data)
        scene.collection.objects.link(obj)
        v = direction(az, el)
        obj.location = centre + v * d
        obj.rotation_euler = (-v).to_track_quat("-Z", "Y").to_euler()
        return obj

    # The rig turns with the camera, so a model whose front is not the
    # file's front (the 1980's phone, az 90) is lit the same way. A model
    # can move the lights and colour them (MODELS[...]["rig"]) — the phone
    # stands in a photograph and takes that photograph's light.
    rig = {
        "key": {"az": -38, "el": 42, "dist": 2.4, "width": 1.1, "shadow": True},   # front, to one side, high: the form and the one shadow
        "fill": {"az": 48, "el": 12, "dist": 2.8, "width": 1.8, "shadow": False},  # front, other side, low, broad: opens the shadows
        "rim": {"az": 155, "el": 38, "dist": 2.4, "width": 0.7, "shadow": False},  # behind, high: the edges off the white
        "top": {"az": 10, "el": 84, "dist": 2.2, "width": 1.4, "shadow": False},   # overhead: the tops of things
    }
    for k, over in m.get("rig", {}).items():
        rig[k] = {**rig[k], **over}
    az0 = a["az"]
    for k, r in rig.items():
        area(k.title(), az0 + r["az"], r["el"], r["dist"], L * r["width"], a[k], shadow=r["shadow"], color=tuple(r.get("color", (1.0, 1.0, 1.0))))

    cam_data = bpy.data.cameras.new("Camera")
    cam_data.lens = a["lens"]
    cam_data.sensor_width = 36
    cam_data.sensor_fit = "HORIZONTAL"
    cam = bpy.data.objects.new("Camera", cam_data)
    scene.collection.objects.link(cam)
    scene.camera = cam
    scene.render.resolution_x = int(a["w"])
    scene.render.resolution_y = int(a["h"])
    scene.render.resolution_percentage = 100

    d = direction(a["az"], a["el"])
    dist = L * 2.0
    fit = []
    for _ in range(5):
        cam.location = centre + d * dist
        cam.rotation_euler = d.to_track_quat("Z", "Y").to_euler()
        bpy.context.view_layer.update()
        xs, ys = [], []
        for p in pts:
            v = world_to_camera_view(scene, cam, p)
            xs.append(v.x)
            ys.append(v.y)
        span = max(max(xs) - min(xs), max(ys) - min(ys))
        want = 1 - 2 * a["margin"] - (0.12 if m["ground"] else 0)
        fit.append((round(dist, 3), round(span, 3)))
        dist *= span / want
    print("FIT", fit)
    cam.location = centre + d * dist
    cam.rotation_euler = d.to_track_quat("Z", "Y").to_euler()
    bpy.context.view_layer.update()
    xs, ys = [], []
    for p in pts:
        v = world_to_camera_view(scene, cam, p)
        xs.append(v.x)
        ys.append(v.y)
    cam_right = cam.matrix_world.to_3x3() @ Vector((1, 0, 0))
    cam_up = cam.matrix_world.to_3x3() @ Vector((0, 1, 0))
    fx = 2 * dist * math.tan(0.5 * cam_data.angle_x)
    fy = fx * a["h"] / a["w"]
    cam.location += cam_right * ((min(xs) + max(xs)) / 2 - 0.5) * fx + cam_up * ((min(ys) + max(ys)) / 2 - 0.5) * fy
    bpy.context.view_layer.update()

    quad = None
    border = None
    if m["screen"]:
        screen_obj = next(o for o in meshes if o.name.startswith(m["screen"]))
        sx, sy = [], []
        for v in screen_obj.data.vertices:
            p = world_to_camera_view(scene, cam, screen_obj.matrix_world @ v.co)
            sx.append(p.x)
            sy.append(1 - p.y)
        quad = {"x": min(sx), "y": min(sy), "w": max(sx) - min(sx), "h": max(sy) - min(sy)}
        if a["close"]:
            # The close plate: the same camera, the picture three times the
            # size, and only the part round the screen rendered — the screen
            # and enough of the case round it that its edge, blended in over
            # the wide plate, falls on plain plastic.
            k = 0.55
            x0 = max(0.0, quad["x"] - k * quad["w"])
            x1 = min(1.0, quad["x"] + quad["w"] * (1 + k))
            y0 = max(0.0, quad["y"] - k * quad["h"])
            y1 = min(1.0, quad["y"] + quad["h"] * (1 + k))
            border = {"x": x0, "y": y0, "w": x1 - x0, "h": y1 - y0}
            scene.render.resolution_percentage = 300
            scene.render.use_border = True
            scene.render.use_crop_to_border = True
            scene.render.border_min_x = x0
            scene.render.border_max_x = x1
            scene.render.border_min_y = 1 - y1
            scene.render.border_max_y = 1 - y0

    scene.render.engine = "CYCLES"
    prefs = bpy.context.preferences.addons["cycles"].preferences
    device = "CPU"
    for kind in ("OPTIX", "CUDA", "HIP", "ONEAPI"):
        try:
            prefs.compute_device_type = kind
            prefs.get_devices()
            if any(dv.type == kind for dv in prefs.devices):
                for dv in prefs.devices:
                    dv.use = dv.type in (kind, "CPU")
                device = kind
                break
        except Exception:
            continue
    scene.cycles.device = "GPU" if device != "CPU" else "CPU"
    scene.cycles.samples = int(a["samples"])
    scene.cycles.use_denoising = True
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.color_depth = "8"
    # Filmic: highlights roll off instead of clipping, and the plastics keep
    # their gradients. Standard would clip the key's highlight to white.
    scene.view_settings.view_transform = "Filmic"
    scene.view_settings.look = "Medium Contrast"
    scene.view_settings.exposure = a["exposure"]
    os.makedirs(WORK, exist_ok=True)
    name = a["model"] + (f"-{a['tag']}" if a["tag"] else "")
    scene.render.filepath = os.path.join(WORK, f"{name}.png")
    bpy.ops.render.render(write_still=True)

    with open(os.path.join(WORK, f"{name}.json"), "w", encoding="utf-8") as f:
        json.dump({"screen": quad, "border": border, "device": device, "args": a, "size": list(size)}, f, indent=2)
    print("RENDERED", device, quad)


# ── outside Blender: run it, then crop and encode ──────────────────────────

def driver_main(a):
    m = MODELS[a["model"]]
    # --preview first: it sets defaults (size, samples) that the options
    # after it may override, on this side and on Blender's alike.
    # Flags go as flags: `--close False` would read as --close.
    cmd = [BLENDER, "-b", "--python", os.path.abspath(__file__), "--", a["model"]]
    if a["preview"]:
        cmd.append("--preview")
    if a["close"]:
        cmd.append("--close")
    for k, v in a.items():
        if k in ("model", "preview", "close"):
            continue
        cmd += [f"--{k}", str(v)]
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if r.returncode != 0 or "RENDERED" not in r.stdout:
        print("\n".join(r.stdout.splitlines()[-30:]))
        print(r.stderr[-3000:])
        raise SystemExit("Blender failed")
    print([l for l in r.stdout.splitlines() if l.startswith("RENDERED")][0])

    import numpy as np
    from PIL import Image, ImageEnhance

    def load(name):
        with open(os.path.join(WORK, f"{name}.json"), encoding="utf-8") as f:
            meta = json.load(f)
        im = Image.open(os.path.join(WORK, f"{name}.png")).convert("RGBA")
        arr = np.array(im)
        arr[:, :, 3] = np.where(arr[:, :, 3] < 6, 0, arr[:, :, 3])
        return meta, Image.fromarray(arr)

    def measure(im):
        """The box round what is in the picture, with a little air: the wide
        plate is cropped to it, and everything is measured against it."""
        W, H = im.size
        alpha = np.asarray(im)[:, :, 3]
        ys, xs = np.where(alpha > 20)
        x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
        mx = int((x1 - x0) * 0.04)
        my = int((y1 - y0) * 0.04)
        return max(0, x0 - mx), max(0, y0 - my), min(W, x1 + mx), min(H, y1 + my)

    def relative(q, box, W, H):
        x0, y0, x1, y1 = box
        return {"x": (q["x"] * W - x0) / (x1 - x0), "y": (q["y"] * H - y0) / (y1 - y0),
                "w": q["w"] * W / (x1 - x0), "h": q["h"] * H / (y1 - y0)}

    def grade(im):
        g = m.get("grade")
        if not g:
            return im
        rgb = im.convert("RGB")
        rgb = ImageEnhance.Brightness(rgb).enhance(g["brightness"])
        rgb = ImageEnhance.Contrast(rgb).enhance(g["contrast"])
        rgb = ImageEnhance.Color(rgb).enhance(g["saturation"])
        arr = np.asarray(rgb).astype(np.float32) * np.array(g["tint"], dtype=np.float32)
        # Lifted blacks, the way a film print has them, so the darkest of the
        # object is no darker than the darkest of the picture it stands in.
        lift = g.get("lift", 0)
        if lift:
            arr = arr + lift * (1 - arr / 255.0)
        # Grain, the picture's own, so the object is not the one clean thing.
        grain = g.get("grain", 0)
        if grain:
            rng = np.random.default_rng(3)
            noise = rng.normal(0, grain, arr.shape[:2]).astype(np.float32)[:, :, None]
            arr = arr + noise * (0.6 + 0.4 * rng.random(arr.shape[:2]).astype(np.float32)[:, :, None])
        out = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
        out.putalpha(im.getchannel("A"))
        return out

    def check(im, name):
        white = Image.new("RGBA", im.size, (255, 255, 255, 255))
        Image.alpha_composite(white, im).convert("RGB").save(os.path.join(WORK, f"{name}-check.jpg"), quality=88)

    if a["close"]:
        # The close plate is placed by where it sits in the wide plate, so
        # the wide render and its crop are read back, not re-rendered.
        meta_a, im_a = load(a["model"])
        W, H = im_a.size
        box = measure(im_a)
        meta_c, im_c = load(f"{a['model']}-close")
        rect = relative(meta_c["border"], box, W, H)
        screen = relative(meta_a["screen"], box, W, H)
        # The screen inside the close plate, for the glass and the type.
        b = meta_c["border"]
        q = meta_a["screen"]
        inner = {"x": (q["x"] - b["x"]) / b["w"], "y": (q["y"] - b["y"]) / b["h"], "w": q["w"] / b["w"], "h": q["h"] / b["h"]}
        out_path = m["out"].replace(".webp", "-close.webp")
        im_c = grade(im_c)
        check(im_c, f"{a['model']}-close")
        if a["preview"]:
            print("PREVIEW close", im_c.size, rect)
            return
        im_c.save(out_path, "WEBP", quality=90, method=6)
        wide_w = min(m["out_w"], box[2] - box[0])
        wide_h = round((box[3] - box[1]) * wide_w / (box[2] - box[0]))
        lines = [
            "// Generated by tools/render-props.py — do not edit by hand.",
            f"// {a['model']}: rendered from the .glb with Blender ({meta_a['device']}), camera az {a['az']} el {a['el']} lens {a['lens']}mm,",
            "// cropped to the object and its shadow. Sizes in pixels; `screen` is the box round the screen, as fractions",
            "// of the picture. `close` is the same picture at three times the size, the part round the screen only",
            "// (--close): where it sits in the wide picture, as fractions, and where the screen sits in it.",
            f"export const {m['const']} = {{",
            f"  src: '{m['src']}',",
            f"  width: {wide_w},",
            f"  height: {wide_h},",
            f"  screen: {{ x: {screen['x']:.4f}, y: {screen['y']:.4f}, w: {screen['w']:.4f}, h: {screen['h']:.4f} }},",
            "  close: {",
            f"    src: '{m['src'].replace('.webp', '-close.webp')}',",
            f"    width: {im_c.width},",
            f"    height: {im_c.height},",
            f"    x: {rect['x']:.4f}, y: {rect['y']:.4f}, w: {rect['w']:.4f}, h: {rect['h']:.4f},",
            f"    screen: {{ x: {inner['x']:.4f}, y: {inner['y']:.4f}, w: {inner['w']:.4f}, h: {inner['h']:.4f} }},",
            "  },",
            "} as const;",
        ]
        with open(m["ts"], "w", encoding="utf-8") as f:
            f.write("\n".join(lines) + "\n")
        print("WROTE", out_path, im_c.size, os.path.getsize(out_path), "bytes", rect)
        return

    name = a["model"] + (f"-{a['tag']}" if a["tag"] else "")
    meta, im = load(name)
    W, H = im.size
    box = measure(im)
    crop = grade(im.crop(box))
    screen = relative(meta["screen"], box, W, H) if meta["screen"] else None

    out_w = m["out_w"]
    if crop.width > out_w:
        crop = crop.resize((out_w, round(crop.height * out_w / crop.width)), Image.LANCZOS)

    check(crop, name)
    if a["preview"]:
        print("PREVIEW", os.path.join(WORK, f"{name}-check.jpg"), crop.size, screen)
        return

    os.makedirs(os.path.dirname(m["out"]), exist_ok=True)
    crop.save(m["out"], "WEBP", quality=92, method=6)
    if not m["ts"]:
        print("WROTE", m["out"], crop.size, os.path.getsize(m["out"]), "bytes (no lib file)")
        return
    lines = [
        "// Generated by tools/render-props.py — do not edit by hand.",
        f"// {a['model']}: rendered from the .glb with Blender ({meta['device']}), camera az {a['az']} el {a['el']} lens {a['lens']}mm,",
        "// cropped to the object" + (" and its shadow" if m["ground"] else "") + ". Sizes in pixels; `screen` is the box round the screen, as fractions of the picture."
        if screen else
        "// cropped to the object. Sizes in pixels.",
        f"export const {m['const']} = {{",
        f"  src: '{m['src']}',",
        f"  width: {crop.width},",
        f"  height: {crop.height},",
    ]
    if screen:
        lines.append(f"  screen: {{ x: {screen['x']:.4f}, y: {screen['y']:.4f}, w: {screen['w']:.4f}, h: {screen['h']:.4f} }},")
    lines.append("} as const;")
    with open(m["ts"], "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    print("WROTE", m["out"], crop.size, os.path.getsize(m["out"]), "bytes", screen or "")


if __name__ == "__main__":
    if "bpy" in sys.modules or os.path.basename(sys.executable).lower().startswith("blender"):
        blender_main(parse(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []))
    else:
        driver_main(parse(sys.argv[1:]))
