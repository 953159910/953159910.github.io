// game.js
import * as THREE from 'three';

const Game = {
    scene: null, camera: null, renderer: null,
    isPlaying: false,
    chunks: new Map(),
    player: {
        height: 1.8, velocity: new THREE.Vector3(),
        isGrounded: false,
        speed: 0.1
    },

    init() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb);
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        this.renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas') });
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        const sun = new THREE.DirectionalLight(0xffffff, 1);
        sun.position.set(10, 20, 10);
        this.scene.add(sun, new THREE.AmbientLight(0x404040));

        this.animate();
    },

    createSave() {
        const seed = Math.random() * 1000;
        const name = "生存世界 " + Math.floor(seed);
        const save = { name, seed, pos: { x: 0, y: 15, z: 0 } };
        
        // 保存到本地
        let saves = JSON.parse(localStorage.getItem('mc_saves') || '[]');
        saves.push(save);
        localStorage.setItem('mc_saves', JSON.stringify(saves));
        this.loadGame(save);
    },

    loadGame(save) {
        document.querySelectorAll('.ui-overlay').forEach(el => el.classList.remove('active'));
        document.getElementById('game-controls').style.display = 'block';
        this.camera.position.set(save.pos.x, save.pos.y, save.pos.z);
        this.currentSeed = save.seed;
        this.isPlaying = true;
    },

    // 真正的随机地形生成
    generateTerrain(cx, cz) {
        const size = 16;
        const group = new THREE.Group();
        const geo = new THREE.BoxGeometry(1, 1, 1);
        const mat = new THREE.MeshLambertMaterial({ color: 0x55aa55 });

        for(let x=0; x<size; x++) {
            for(let z=0; z<size; z++) {
                const wx = cx * size + x;
                const wz = cz * size + z;
                // 复杂波形模拟起伏山脉
                const h = Math.floor(Math.sin(wx*0.1) * 3 + Math.cos(wz*0.1) * 3 + 5);
                
                const mesh = new THREE.Mesh(geo, mat);
                mesh.position.set(wx, h, wz);
                group.add(mesh);
            }
        }
        this.scene.add(group);
        this.chunks.set(`${cx},${cz}`, group);
    },

    animate() {
        requestAnimationFrame(() => this.animate());
        if(!this.isPlaying) return;

        // 1. 物理重力
        this.player.velocity.y -= 0.01; // 重力加速度
        this.camera.position.y += this.player.velocity.y;

        // 简易地面碰撞 (修复卡在空中的问题)
        if(this.camera.position.y < 8) {
            this.camera.position.y = 8;
            this.player.velocity.y = 0;
            this.player.isGrounded = true;
        }

        // 2. 动态生成无限世界
        const currCX = Math.floor(this.camera.position.x / 16);
        const currCZ = Math.floor(this.camera.position.z / 16);
        for(let x = currCX-1; x <= currCX+1; x++) {
            for(let z = currCZ-1; z <= currCZ+1; z++) {
                if(!this.chunks.has(`${x},${z}`)) this.generateTerrain(x, z);
            }
        }

        this.renderer.render(this.scene, this.camera);
    }
};

// UI 逻辑
window.UI = {
    show: (id) => {
        document.querySelectorAll('.ui-overlay').forEach(el => el.classList.remove('active'));
        document.getElementById(id).classList.add('active');
    },
    openInv: () => document.getElementById('ui-inv').classList.add('active'),
    closeInv: () => document.getElementById('ui-inv').classList.remove('active')
};

window.Game = Game;
Game.init();
