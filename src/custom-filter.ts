import { ThinEngine } from "@babylonjs/core/Engines/thinEngine";
import { Constants } from "@babylonjs/core/Engines/constants";
import { HtmlElementTexture } from "@babylonjs/core/Materials/Textures/htmlElementTexture";
import { EffectWrapper } from "@babylonjs/core/Materials/effectRenderer";

import { ImageFilter } from "@babylonjs/controls/dist/src/imageFilter";
import { Resizer } from "@babylonjs/controls/dist/src/resizer";

// import { ShaderConfiguration } from "./shader";

// Find back the rendering Canvas
const mainCanvas = document.getElementById("renderCanvas") as HTMLCanvasElement;

// Filter video in realtime by reusing the babylon controls and our thinEngine... cause size matters.
async function main() {
    const customFilter = new ImageFilter(mainCanvas);
    const resizer = new Resizer(customFilter);
    const engine = customFilter.engine;

    const customEffectWrapper = new EffectWrapper({
    name: "Custom",
    engine: customFilter.engine,
    fragmentShader: `
        // Samplers
        varying vec2 vUV;
        uniform sampler2D textureSampler;
        
        void main(void) 
        {
            gl_FragColor = texture2D(textureSampler, vUV);

            // Swizzle channels
            float r = gl_FragColor.r;
            gl_FragColor.r = gl_FragColor.b;
            gl_FragColor.b = r;
        }
    `,
    samplerNames: ["textureSampler"]
});

/**
 * Creates a video texture from a stream.
 * This is fully available in the Babylon Video Texture and is only here for education purpose.
 */
 function createVideoTextureFromStreamAsync(engine: ThinEngine, stream: MediaStream): Promise<HtmlElementTexture> {
    var video = document.createElement("video");
    video.setAttribute('autoplay', '');
    video.setAttribute('muted', 'true');
    video.setAttribute('playsinline', '');
    video.muted = true;

    if (video.mozSrcObject !== undefined) {
        // hack for Firefox < 19
        video.mozSrcObject = stream;
    } else {
        if (typeof video.srcObject == "object") {
            video.srcObject = stream;
        } else {
            window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;
            video.src = (window.URL && window.URL.createObjectURL(stream));
        }
    }


return new Promise<HtmlElementTexture>((resolve) => {
    let onPlaying = () => {
        const webcamTexture = new HtmlElementTexture("video", video, {
            engine,
            scene: null,
        });

        // No repeat is needed here for WebGL1.
        webcamTexture.wrapU = Constants.TEXTURE_CLAMP_ADDRESSMODE;
        webcamTexture.wrapV = Constants.TEXTURE_CLAMP_ADDRESSMODE;

        video.removeEventListener("playing", onPlaying);

        resolve(webcamTexture);
    };

    video.addEventListener("playing", onPlaying);
    video.play();
});
}

/**
 * Gets a webcam feed and converts it into a video texture.
 * This is fully available in the Babylon Video Texture and 
 * is only here for education purpose.
 */
function getWebcamTextureAsync(engine: ThinEngine): Promise<HtmlElementTexture> {
    if (navigator.mediaDevices) {
        return navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user" },
                audio: false
            })
            .then((stream) => {
                return createVideoTextureFromStreamAsync(engine, stream);
            });
    }

    return Promise.reject("navigator.mediaDevices.getUserMedia is not supported by your browser.");
}

main();

