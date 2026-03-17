//Getting all the images by pull
const Docker = require("dockerode");
const { LANGUAGES } = require("../config/languages");

// Windows named pipe
const docker = new Docker({ socketPath: "//./pipe/docker_engine" });

async function pullImages(){
    // Deduplicate — C and C++ share gcc:13, no point pulling twice
    const uniqueImages = [...new Set(Object.values(LANGUAGES).map((l)=> l.image))];

    console.log("Checking Docker imagess....");

    //Check Docker is reachable first - fail loudly if not
    try{
        await docker.ping();
        console.log("Docker daemon reachable");
    }catch(err){
        console.error("Cannot reach Docker daemon:",err.message);
        console.error("Make sure docker is running and the socket is mounted");
        process.exit(1); // hard exit — execution won't work without Docker
    }

    for(const image of uniqueImages){
        try{
            await docker.getImage(image).inspect();
            console.log(`${image} already cached`);
        }catch(_){
            //Image not fount locally - pull it
            console.log(`Pulling ${image}..`);
            await new Promise((resolve,reject)=>{
                docker.pull(image,(err,stream)=>{
                    if(err) return reject(err);
                    //Log pull progress
                    docker.modem.followProgress(stream,(err,output)=>{
                        if(err) return reject(err);
                        console.log(`${image} pulled successfully`);
                        resolve(output);
                    });
                });
            });
        }
    }
    console.log("All execution images ready\n");
}

module.exports = { pullImages };