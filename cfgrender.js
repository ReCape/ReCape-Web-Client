THREE.Cache.enabled = false;

// Coordinate data
var skinParts = {
    "head": [8, 8, 8, -4, 12, -4],
    "body": [8, 12, 4, -4, 0, -2],
    "leftArm": [4, 12, 4, -8, 0, -2],
    "rightArm": [4, 12, 4, 4, 0, -2],
    "leftLeg": [4, 12, 4, -4, -12, -2],
    "rightLeg": [4, 12, 4, 0, -12, -2]
}
var slimSkinParts = {
    "leftArm": [3, 12, 4, -7, 0, -2],
    "rightArm": [3, 12, 4, 4, 0, -2]
}

var skinTextureOffsets = {
    "head": [0, 0],
    "body": [16, 16],
    "leftArm": [32, 48],
    "rightArm": [40, 16],
    "leftLeg": [16, 48],
    "rightLeg": [0, 16],
    "headSecond": [32, 0],
    "bodySecond": [16, 32],
    "leftArmSecond": [48, 48],
    "rightArmSecond": [40, 32],
    "leftLegSecond": [0, 48],
    "rightLegSecond": [0, 32]
}

var slimAreas = [
    [50, 16, 2, 4],
    [54, 20, 2, 12],
    [42, 48, 2, 4],
    [46, 52, 2, 12],
]

// generates UV mappings for the Minecraft texture format
function generateMapping(size, offset, textureSize) {
    var width = size[0];
    var height = size[1];
    var depth = size[2];

    sizeX = textureSize[0]
    sizeY = textureSize[1]

    offsetX = offset[0]
    offsetY = offset[1]
    /*
    [0, 1],
    [1, 1],
    [0, 0],
    [1, 0]
    */

    /* Mapping 
    Each face is made up of 4 coordinates (each is a value between 0 and 1) that determines the face's texture position.
    
    It goes in this order:
    [X, Y]
    - TL
    - TR
    - BL
    - BR
    */
    const mapping = [
        //Left
        [
            [0, (sizeX - depth)],
            [depth, (sizeX - depth)],
            [0, (sizeX - depth - height)],
            [depth, (sizeX - depth - height)]
        ],

        //Right
        [
            [(depth + width), (sizeX - depth)],
            [(depth * 2 + width), (sizeX - depth)],
            [(depth + width), (sizeX - depth - height)],
            [(depth * 2 + width), (sizeX - depth - height)]
        ],

        //Top
        [
            [depth, sizeY],
            [(depth + width), sizeY],
            [depth, (sizeY - depth)],
            [(depth + width), (sizeY - depth)]
        ],

        //Bottom
        [
            [(depth + width), sizeY],
            [(depth + width * 2), sizeY],
            [(depth + width), (sizeY - depth)],
            [(depth + width * 2), (sizeY - depth)]
        ],

        //Back
        [
            [(depth * 2 + width), (sizeX - depth)],
            [(depth * 2 + width * 2), (sizeX - depth)],
            [(depth * 2 + width), (sizeX - depth - height)],
            [(depth * 2 + width * 2), (sizeX - depth - height)]
        ],

        //Front
        [

            [depth, (sizeX - depth)],
            [(depth + width), (sizeX - depth)],
            [depth, (sizeX - depth - height)],
            [(depth + width), (sizeX - depth - height)]
        ]
    ]

    for (let i = 0; i < mapping.length; i++) {
        for (let j = 0; j < 4; j++) {
            mapping[i][j][0] += offsetX
            mapping[i][j][1] -= offsetY
            mapping[i][j][0] /= sizeX
            mapping[i][j][1] /= sizeY
        }
    }

    return mapping;
}

// Globals
var scene;
var camera;
var renderer;
var controls;

// Generates the scene
function createScene(width=0.6) {
    var sceneSize = [window.innerWidth * width, window.innerHeight]

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, sceneSize[0] / sceneSize[1], 1, 1000);
    camera.position.set(2, 5, 10);
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });
    renderer.setSize(sceneSize[0], sceneSize[1]);
    renderer.domElement.classList.add("cfgviewer");
    document.getElementById("preview").appendChild(renderer.domElement);

    const light = new THREE.HemisphereLight(0xffffff, 0x999999, 2)
    scene.add(light)

    controls = new THREE.OrbitControls(camera, renderer.domElement);

    camera.rotateX(-0.5);
    camera.rotateY(0.5);
    camera.rotateZ(0.5);
    camera.position.set(27, 40, 20)

    window.addEventListener( 'resize', onWindowResize, false );

    function onWindowResize(){
        var sceneSize = [window.innerWidth * 0.6, window.innerHeight]
        camera.aspect = sceneSize[0] / sceneSize[1];
        camera.updateProjectionMatrix();

        renderer.setSize( sceneSize[0], sceneSize[1] );

    }

    render();
}

function loadModelFromPath(model, texture) {
    loadTexture(texture, (texture)=>{loadCfg(model, texture)});
}
function loadSkin(texture) {
    loadTexture(texture, (texture)=>{loadPlayer(texture)})
}
function loadCape(texture) {
    loadTexture(texture, (texture)=>{loadCapeGeometry(texture)})
}

async function readFile(file) {
    result = await fetch(file);
    return result.text();
}

function loadCfg(path, texture) {
    readFile(path).then((text) => {
        model = JSON.parse(text)
        loadModels(model, texture)
    })
}

function textureToCanvas(texture) {
    const canvas = document.createElement('canvas');
    canvas.width = texture.image.width;
    canvas.height = texture.image.height;

    const context = canvas.getContext('2d', {
        willReadFrequently: true
    });
    context.drawImage(texture.image, 0, 0);

    return [canvas, context]
}

function hasTransparency(context, x0, y0, w, h) {
    const imgData = context.getImageData(x0, y0, w, h);
    for (let x = 0; x < w; x++) {
        for (let y = 0; y < h; y++) {
            const offset = (x + y * w) * 4;
            if (imgData.data[offset + 3] !== 0xff) {
                return true;
            }
        }
    }
    return false;
}

function isAreaWhite(context, x0, y0, w, h) {
    const imgData = context.getImageData(x0, y0, w, h);
    for (let x = 0; x < w; x++) {
        for (let y = 0; y < h; y++) {
            const offset = (x + y * w) * 4;
            if (!(
                    imgData.data[offset + 0] === 0xff &&
                    imgData.data[offset + 1] === 0xff &&
                    imgData.data[offset + 2] === 0xff &&
                    imgData.data[offset + 3] === 0xff
                )) {
                return false;
            }
        }
    }
    return true;
}

function isAreaBlack(context, x0, y0, w, h) {
    const imgData = context.getImageData(x0, y0, w, h);
    for (let x = 0; x < w; x++) {
        for (let y = 0; y < h; y++) {
            const offset = (x + y * w) * 4;
            if (!(
                    imgData.data[offset + 0] === 0 &&
                    imgData.data[offset + 1] === 0 &&
                    imgData.data[offset + 2] === 0 &&
                    imgData.data[offset + 3] === 0xff
                )) {
                return false;
            }
        }
    }
    return true;
}

function loadTexture(path, callback) {
    const loader = new THREE.TextureLoader();
    const texture = loader.load(path, callback)
    texture.wrapS = THREE.Repeat;
    texture.wrapT = THREE.Repeat;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.LinearMipMapLinearFilter;
    texture.repeat.set(1, 1);
    return texture;
}

var textureSize;

function isSkinSlim(texture) {
    var canvasAndContext = textureToCanvas(texture);
    var canvas = canvasAndContext[0];
    var context = canvasAndContext[1];
    var scale = canvas.width / 64.0;
    result = false;
    blackAreas = 0;
    whiteAreas = 0;
    slimAreas.forEach((slimArea) => {
        for (let i = 0; i < slimArea.length; i++) {
            slimArea[i] *= scale;
        }

        if (hasTransparency(context, slimArea[0], slimArea[1], slimArea[2], slimArea[3])) {
            result = true;
        } else if (isAreaBlack(context, slimArea[0], slimArea[1], slimArea[2], slimArea[3])) {
            blackAreas++;
        } else if (isAreaWhite(context, slimArea[0], slimArea[1], slimArea[2], slimArea[3])) {
            whiteAreas++;
        }
    });
    if (blackAreas >= 4 || whiteAreas >= 4) {
        result = true;
    }
    return result;
}

const outerLayerDistance = 0.2

function loadOuterLayer(skinPart, texture) {
    skinPartName = skinPart[0]
    skinPart = skinPart[1]
    const geometry = new THREE.BoxGeometry(skinPart[0] + outerLayerDistance, skinPart[1] + outerLayerDistance, skinPart[2] + outerLayerDistance);

    const UVMap = generateMapping([skinPart[0], skinPart[1], skinPart[2]], skinTextureOffsets[skinPartName + "Second"], [64, 64])

    var uvAttribute = geometry.attributes.uv;

    // The UV index we're editing
    var index = 0

    // For each plane
    for (var i = 0; i < uvAttribute.count / 4; i += 1) {

        // For each corner of plane
        for (var j = 0; j < 4; j++) {

            var u = uvAttribute.getX(index);
            var v = uvAttribute.getY(index);

            var newU = UVMap[i][j][0] ///6
            var newV = UVMap[i][j][1] ///6

            uvAttribute.setXY(index, newU, newV);
            index++;
        }

    }

    const material = new THREE.MeshStandardMaterial({
        map: texture,
        transparent: true
    });

    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(skinPart[3] + skinPart[0] / 2, skinPart[4] + skinPart[1] / 2, skinPart[5] + skinPart[2] / 2)

    scene.add(cube)
}

var capePart = [10, 16, 1, -5, -3.4, 3.2]

function loadCapeGeometry(cape) {

    const geometry = new THREE.BoxGeometry(capePart[0], capePart[1], capePart[2]);
    const UVMap = generateMapping([capePart[0], capePart[1], capePart[2]], [0, 0], [64, 32])

    var uvAttribute = geometry.attributes.uv;

    // The UV index we're editing
    var index = 0

    // For each plane
    for (var i = 0; i < uvAttribute.count / 4; i += 1) {

        // For each corner of plane
        for (var j = 0; j < 4; j++) {

            var u = uvAttribute.getX(index);
            var v = uvAttribute.getY(index);

            var newU = UVMap[i][j][0] ///6
            var newV = UVMap[i][j][1] ///6

            uvAttribute.setXY(index, newU, newV);
            index++;
        }

    }

    const material = new THREE.MeshStandardMaterial({
        map: cape,
        transparent: true
    });

    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(capePart[3] + capePart[0] / 2, capePart[4] + capePart[1] / 2, capePart[5] + capePart[2] / 2)
    cube.rotation.set(-10 * (Math.PI / 180), 180 * (Math.PI / 180), 0)
    scene.add(cube)
}

function loadPlayer(texture) {
    var isSlim = isSkinSlim(texture)
    var loadingParts = skinParts;
    if (isSlim) {
        Object.entries(slimSkinParts).forEach((skinPart) => {
            loadingParts[skinPart[0]] = skinPart[1];
        })
    }
    Object.entries(loadingParts).forEach((skinPart) => {
        skinPartName = skinPart[0]
        skinPart = skinPart[1]
        const geometry = new THREE.BoxGeometry(skinPart[0], skinPart[1], skinPart[2]);
        const UVMap = generateMapping([skinPart[0], skinPart[1], skinPart[2]], skinTextureOffsets[skinPartName], [64, 64])

        var uvAttribute = geometry.attributes.uv;

        // The UV index we're editing
        var index = 0

        // For each plane
        for (var i = 0; i < uvAttribute.count / 4; i += 1) {

            // For each corner of plane
            for (var j = 0; j < 4; j++) {

                var u = uvAttribute.getX(index);
                var v = uvAttribute.getY(index);

                var newU = UVMap[i][j][0] ///6
                var newV = UVMap[i][j][1] ///6

                uvAttribute.setXY(index, newU, newV);
                index++;
            }

        }

        const material = new THREE.MeshStandardMaterial({
            map: texture
        });

        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(skinPart[3] + skinPart[0] / 2, skinPart[4] + skinPart[1] / 2, skinPart[5] + skinPart[2] / 2)

        scene.add(cube)

        loadOuterLayer([skinPartName, skinPart], texture)
    })
}

function loadCube(pos, size, offset, textureSize, group, texture) {
    const geometry = new THREE.BoxGeometry(size[0], size[1], size[2]);

    const UVMap = generateMapping(size, offset, textureSize)

    var uvAttribute = geometry.attributes.uv;

    // The UV index we're editing
    var index = 0

    // For each plane
    for (var i = 0; i < uvAttribute.count / 4; i += 1) {

        // For each corner of plane
        for (var j = 0; j < 4; j++) {

            var u = uvAttribute.getX(index);
            var v = uvAttribute.getY(index);

            var newU = UVMap[i][j][0] ///6
            var newV = UVMap[i][j][1] ///6

            uvAttribute.setXY(index, newU, newV);
            index++;
        }

    }

    const material = new THREE.MeshStandardMaterial({
        map: texture
    });

    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(pos[0] + size[0] / 2, pos[1] + size[1] / 2, pos[2] + size[2] / 2)

    group.add(cube)
}

function loadBox(box, group, texture) {
    var coordinates = box["coordinates"];
    var offset = box["textureOffset"]
    loadCube(
        [coordinates[0], coordinates[1],
            coordinates[2]
        ], [coordinates[3],
            coordinates[4], coordinates[5]
        ],
        offset, textureSize, group, texture
    );
}

// The offsets we need to apply to different parts depending on where they're attached
var skinOffsets = {
    "head": [0, 12, 0],
    "body": [0, 12, 0],
    "leftArm": [-5, 10, 0],
    "rightArm": [5, 10, 0],
    "leftLeg": [-2, 0, 0],
    "rightLeg": [2, 0, 0]
}

function loadModel(model, texture, parent) {
    var modelGroup = new THREE.Group();

    if (model.hasOwnProperty("attachTo")) {
        var offset = skinOffsets[model["attachTo"]];
        modelGroup.translateX(offset[0])
        modelGroup.translateY(offset[1])
        modelGroup.translateZ(offset[2])
    }

    translation = model["translate"]
    modelGroup.translateX(translation[0])
    modelGroup.translateY(translation[1])
    modelGroup.translateZ(translation[2])

    if (model.hasOwnProperty("rotate")) {
        rotation = model["rotate"]
        modelGroup.rotateZ(rotation[2] * (Math.PI / 180));
        modelGroup.rotateY(rotation[1] * (Math.PI / 180));
        modelGroup.rotateX(rotation[0] * (Math.PI / 180));

    }

    if (model.hasOwnProperty("boxes")) {
        var boxes = model["boxes"]
        boxes.forEach(box => {
            loadBox(box, modelGroup, texture)
        });
    }

    if (model.hasOwnProperty("submodels")) {
        var submodels = model["submodels"]
        submodels.forEach((submodel) => {
            loadModel(submodel, texture, modelGroup);
        });
    }

    if (parent != undefined) {
        parent.add(modelGroup)
    } else {
        scene.add(modelGroup)
    }
}

function loadModels(model, texture) {
    textureSize = model["textureSize"]
    var models = model["models"]
    models.forEach(model => {
        loadModel(model, texture)
    });
}

function render() {
    requestAnimationFrame(render);
    renderer.render(scene, camera);
}