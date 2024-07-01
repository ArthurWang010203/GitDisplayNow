let generate = document.getElementById('generate3');

vs = 
`#version 300 es
in vec3 position;
in vec4 vcolor;
in vec3 normal;
out vec4 fcolor;
out vec3 fnormal;
uniform mat4 p;
uniform mat4 mv;
void main() {
    gl_Position = p * mv * vec4(position,1);
    fcolor = vcolor;
    fnormal = normal;
}`
fs = 
`#version 300 es
precision highp float;
uniform vec4 color;
uniform vec3 lightdir;
uniform vec3 lightcolor;
uniform vec3 halfway;
in vec4 fcolor;
in vec3 fnormal;
out vec4 fragColor;
void main() {
	fragColor = fcolor;
}`

var bigI =
    {"triangles":
        [0,1,3
        ,0,2,3
		,4,5,6
		,5,6,7
		,8,9,10
		,10,11,8
		
		,12,13,15
        ,12,14,15
		,16,17,18
		,17,18,19
		,20,21,22
		,22,23,20
        ]
    ,"attributes":
        {"position":
            [[ 0.2, 0.6, 0.0]
            ,[ 0.2, 0.8, 0.0]
            ,[-0.2, 0.6, 0.0]
            ,[-0.2, 0.8, 0.0]
			
            ,[ 0.2, 0.0, 0.0]
            ,[ 0.2, 0.2, 0.0]
            ,[-0.2, 0.0, 0.0]
			,[-0.2, 0.2, 0.0]
			
			,[ 0.1, 0.6, 0.0]
			,[ 0.1, 0.2, 0.0]
			,[-0.1, 0.2, 0.0]
			,[-0.1, 0.6, 0.0]
			
			
			,[ 0.225, 0.575,-0.001]
            ,[ 0.225, 0.825,-0.001]
            ,[-0.225, 0.575,-0.001]
            ,[-0.225, 0.825,-0.001]
			
            ,[ 0.225,-0.025,-0.001]
            ,[ 0.225, 0.225,-0.001]
            ,[-0.225,-0.025,-0.001]
			,[-0.225, 0.225,-0.001]
			
			,[ 0.125, 0.575,-0.001]
			,[ 0.125, 0.225,-0.001]
			,[-0.125, 0.225,-0.001]
			,[-0.125, 0.575,-0.001]
            ]
        ,"vcolor":
            [[1, 0.373, 0.02, 1]
            ,[1, 0.373, 0.02, 1]
            ,[1, 0.373, 0.02, 1]
            ,[1, 0.373, 0.02, 1]
            ,[1, 0.373, 0.02, 1]
            ,[1, 0.373, 0.02, 1]
            ,[1, 0.373, 0.02, 1]
			,[1, 0.373, 0.02, 1]
			,[1, 0.373, 0.02, 1]
			,[1, 0.373, 0.02, 1]
			,[1, 0.373, 0.02, 1]
			,[1, 0.373, 0.02, 1]
			
			,[0.075, 0.16, 0.292, 1]
            ,[0.075, 0.16, 0.292, 1]
            ,[0.075, 0.16, 0.292, 1]
            ,[0.075, 0.16, 0.292, 1]
            ,[0.075, 0.16, 0.292, 1]
            ,[0.075, 0.16, 0.292, 1]
            ,[0.075, 0.16, 0.292, 1]
			,[0.075, 0.16, 0.292, 1]
			,[0.075, 0.16, 0.292, 1]
			,[0.075, 0.16, 0.292, 1]
			,[0.075, 0.16, 0.292, 1]
			,[0.075, 0.16, 0.292, 1]
            ]
        }
    }

const IdentityMatrix = new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1])
const IlliniBlue = new Float32Array([0.075, 0.16, 0.292, 1])
const IlliniOrange = new Float32Array([1, 0.373, 0.02, 1])

function compileAndLinkGLSL(vs_source, fs_source) {
    let vs = gl.createShader(gl.VERTEX_SHADER)
    gl.shaderSource(vs, vs_source)
    gl.compileShader(vs)
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(vs))
        throw Error("Vertex shader compilation failed")
    }

    let fs = gl.createShader(gl.FRAGMENT_SHADER)
    gl.shaderSource(fs, fs_source)
    gl.compileShader(fs)
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(fs))
        throw Error("Fragment shader compilation failed")
    }

    let program = gl.createProgram()
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program))
        throw Error("Linking failed")
    }
    
    return program
}
function supplyDataBuffer(data, program, vsIn, mode) {
    if (mode === undefined) mode = gl.STATIC_DRAW
    
    let buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    let f32 = new Float32Array(data.flat())
    gl.bufferData(gl.ARRAY_BUFFER, f32, mode)
    
    let loc = gl.getAttribLocation(program, vsIn)
    console.log(loc);
    gl.vertexAttribPointer(loc, data[0].length, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(loc)
    
    return buf;
}

function addNormals() {
    console.log("Adding normals for facets");
    myGeometry.attributes.normal = [];
    for (let i = 0; i < myGeometry.attributes.position.length; i++) {
        myGeometry.attributes.normal.push([0,0,0]);
    }
    for (let i = 0; i < myGeometry.triangles.length/3; i++) {
        let tri0 = myGeometry.triangles[i*3];
        let tri1 = myGeometry.triangles[i*3+1];
        let tri2 = myGeometry.triangles[i*3+2];
        let v0 = myGeometry.attributes.position[parseInt(tri0)];
		let v1 = myGeometry.attributes.position[parseInt(tri1)];
		let v2 = myGeometry.attributes.position[parseInt(tri2)];
		let edge1 = sub(v1,v2)
		let edge2 = sub(v2,v0)
		let norm = normalize(cross(edge1,edge2));

        myGeometry.attributes.normal[tri0] = (add(myGeometry.attributes.normal[tri0],norm));
        myGeometry.attributes.normal[tri1] = (add(myGeometry.attributes.normal[tri1],norm));
        myGeometry.attributes.normal[tri2] = (add(myGeometry.attributes.normal[tri2],norm));
        
    }
    console.log("Added normals, moving on...");
}

function setupGeomery(stuff) {
    var triangleArray = gl.createVertexArray()
    gl.bindVertexArray(triangleArray);
    for(let name in stuff.attributes) {
        let data = stuff.attributes[name]
        console.log("Adding attrib pointer for " + name);
        console.log(name + " contains ", data[0].length);
        supplyDataBuffer(data, program, name)
    }

    var indices = new Uint32Array(stuff.triangles.flat())
    var indexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW)

    return {
        mode: gl.TRIANGLES,
        count: indices.length,
        type: gl.UNSIGNED_INT,
        vao: triangleArray
    }
}
function parseData(data) {
    // data input as string
    // v . . . 
    // f . . .
    let dataArray = data.split("\n");
    console.log("Parsing data...");
    let temp = {"triangles":[]
    ,"attributes":
        {"position":[]
        ,"vcolor":[]
        }
    };
    let count = 0;
    for (var line of dataArray) {
        if (line.startsWith("v ")) {
            // vertex coordinate
            let coordinates = line.slice(2).split(" "); // three string floats in coordinates
            let x_ = parseFloat(coordinates[0]);
            let y_ = parseFloat(coordinates[1]);
            let z_ = parseFloat(coordinates[2]);
            if (window.xMax == null) {
                window.xMax = Math.abs(x_);
                window.zMax = Math.abs(z_);
            }
            else {
                window.xMax = Math.max(Math.abs(x_),window.xMax);
                window.zMax = Math.max(Math.abs(z_),window.zMax);
            }
            // window.xMin = Math.min(x_,window.xMin);
            // window.zMin = Math.min(z_,window.zMin);
            window.xAvg += x_;
            window.yAvg += y_;
            window.zAvg += z_;
            count += 1;
            temp.attributes.position.push([x_,y_,z_]); // append vertex coordinate to geom dictionary
            temp.attributes.vcolor.push([Math.random(),Math.random(),Math.random(), 1]);
        }
        else if(line.startsWith("f ")) {
            // face structure
            let triangles = line.slice(2).split(" ");
            temp.triangles.push(parseInt(triangles[0].split("/")[0])-1); // append triangle to geom dictionary
            temp.triangles.push(parseInt(triangles[1].split("/")[0])-1);
            temp.triangles.push(parseInt(triangles[2].split("/")[0])-1);
        }
    }
    //console.log(window.xAvg,window.yAvg,window.zAvg);
    window.xAvg /= parseFloat(count);
    window.zAvg /= parseFloat(count); // where camera should center
    window.yAvg /= parseFloat(count);
    console.log("Finished parsing data, moving on...");
    return temp;
}
function draw() {
    //gl.clearColor(...[0.0,0.6,0.96,1]); // draw the default I logo
    gl.clearColor(...[0.2,0.2,0.2,1]);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(program);

    gl.bindVertexArray(geom.vao);
    //setupGeomery(myGeometry);

    let lightdir = normalize([window.xMax*2,window.yAvg*2,window.zMax*2]);
	let halfway = normalize(add(lightdir,[0,0,1]));
	
	gl.uniform3fv(gl.getUniformLocation(program, 'halfway'), halfway);
	
	gl.uniform3fv(gl.getUniformLocation(program, 'lightdir'), lightdir);
	gl.uniform3fv(gl.getUniformLocation(program, 'lightcolor'), normalize([3,3,3]))

    gl.uniform4fv(gl.getUniformLocation(program, 'color'), IlliniOrange);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, 'mv'), false, m4mul(v,m1)); // rotate along path
    gl.uniformMatrix4fv(gl.getUniformLocation(program, 'p'), false, p);
    gl.drawElements(geom.mode, geom.count, geom.type, 0);
}

function timeStep(milliSeconds) {
    window.m1 = m4mul(m1,m4rotY(0.01));
    draw();
    requestAnimationFrame(timeStep);

}

function setup(myGeometry) {
    window.gl = document.querySelector('canvas').getContext('webgl2',
        // optional configuration object: see https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext
        {antialias: false, depth:true, preserveDrawingBuffer:true}
    )
    window.program = compileAndLinkGLSL(vs,fs);
    gl.enable(gl.DEPTH_TEST);
    console.log(myGeometry);
    window.geom = setupGeomery(myGeometry);
    console.log(geom);
    
    let canvas = document.querySelector('canvas');
    window.p = m4perspNegZ(0.1, 1000, 1.5, canvas.clientWidth, canvas.clientHeight);
    window.v = m4view([2.5*xMax,(xMax+zMax)/2 * 1.5,2.5*zMax], [window.xAvg,window.yAvg,window.zAvg], [0,1,0]);
    window.m1 = m4trans(0,0,0);

    let lightdir = normalize([xMax*2,(yAvg+0.3)*2,zMax*2]);
    console.log(lightdir);
    console.log(dot(lightdir,normalize(new Float32Array([0,0,2]))));

    requestAnimationFrame(timeStep); // default animation is #1
}

chrome.runtime.onMessage.addListener((req, sender, res) => {
    let data = req.data;

    let parentElement = document.body;
    let element = document.createElement("canvas");
    element.setAttribute("width",500);
    element.setAttribute("height",500);
    parentElement.appendChild(element);
    console.log("Created canvas!");
    //alert(data)
    //setupGeometry(data);
    window.xAvg = 0;
    window.zAvg = 0;
    window.yAvg = 0;
    window.xMax = null;
    window.zMax = null;
    console.log("is myGeometry set?");
    window.myGeometry = parseData(data);
    //addNormals(window.myGeometry);
    console.log(myGeometry);
    setup(myGeometry);
})

generate.addEventListener("click", async () => {
    let [tab] = await chrome.tabs.query({active: true, currentWindow:true});

    chrome.scripting.executeScript({
        target: {tabId: tab.id},
        func: generate3dModel,
    });
})



function generate3dModel() {
    //setup();
    //const emailRegEx = /[\w\.=-]+@[\w\.-]+\.[\w]{2,3}/gim;
    //let fileName = document.getElementById('file-name-id');
    //console.log(fileName);
    //console.log(fileName.innerHTML);
    // if(String(fileName.value).includes(".obj")) {
    //     alert("obj file found");
    // }
    //let emails = document.body.innerHTML.match(emailRegEx);
    let test = document.getElementById('read-only-cursor-text-area');
    if (test == null) {
         alert("No data found");
         return;
    }
    let data = String(test.value);
    chrome.runtime.sendMessage({data});
}