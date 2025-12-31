
import * as THREE from 'three';

const Game = {
    scene: null, camera: null, renderer: null,
    isPlaying: false,
    mode: 'survival', // 默认生存模式
    player: { vel: new THREE.Vector3(), onGround: false, speed: 0.15 },
    moveDir: { f: 0, r: 0 },
    chunks: new Map(),

    init() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb);
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
        
        this.renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas'), antialias: false });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
        this.scene.add(light);

        this.bindEvents();
        this.animate();
    },

    setMode(m) {
        this.mode = m;
        document.getElementById('mode-survival').classList.toggle('active', m === 'survival');
        document.getElementById('mode-creative').classList.toggle('active', m === 'creative');
    },

    startNew() {
        this.isPlaying = true;
        this.camera.position.set(0, 20, 0);
        UI.hideAll();
        document.getElementById('game-controls').style.display = 'block';
        document.getElementById('hud').style.display = 'flex';
    },

    bindEvents() {
        // 摇杆逻辑
        const stick = document.getElementById('stick');
        document.getElementById('joystick-zone').addEventListener('touchmove', (e) => {
            const t = e.touches[0];
            const r = e.currentTarget.getBoundingClientRect();
            const dx = t.clientX - (r.left + 60), dy = t.clientY - (r.top + 60);
            const d = Math.min(Math.sqrt(dx*dx+dy*dy), 45);
            const a = Math.atan2(dy, dx);
            stick.style.transform = `translate(${Math.cos(a)*d}px, ${Math.sin(a)*d}px)`;
            this.moveDir.f = -Math.sin(a) * (d/45);
            this.moveDir.r = Math.cos(a) * (d/45);
        });

        document.getElementById('joystick-zone').addEventListener('touchend', () => {
            stick.style.transform = 'translate(0,0)';
            this.moveDir = { f: 0, r: 0 };
        });

        // 动作按钮绑定
        document.getElementById('btn-jump').onclick = () => {
            if (this.player.onGround || this.mode === 'creative') this.player.vel.y = 0.2;
        };
        
        document.getElementById('btn-attack').onclick = () => console.log("挖掘方块...");
        document.getElementById('btn-place').onclick = () => console.log("放置方块...");
    },

    animate() {
        requestAnimationFrame(() => this.animate());
        if (!this.isPlaying) return;

        // 模式逻辑
        if (this.mode === 'survival') {
            this.player.vel.y -= 0.01; // 重力
        } else {
            this.player.vel.y *= 0.9; // 创造模式漂浮感
        }

        this.camera.position.y += this.player.vel.y;

        // 地面碰撞检测 (简易版)
        if (this.camera.position.y < 10) {
            this.camera.position.y = 10;
            this.player.vel.y = 0;
            this.player.onGround = true;
        } else {
            this.player.onGround = false;
        }

        // 移动
        this.camera.translateZ(-this.moveDir.f * this.player.speed);
        this.camera.translateX(this.moveDir.r * this.player.speed);

        // 地形动态生成
        const cx = Math.floor(this.camera.position.x / 10);
        const cz = Math.floor(this.camera.position.z / 10);
        if (!this.chunks.has(`${cx},${cz}`)) this.generateChunk(cx, cz);

        this.renderer.render(this.scene, this.camera);
    },

    generateChunk(cx, cz) {
        const group = new THREE.Group();
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(10, 1, 10),
            new THREE.MeshLambertMaterial({ color: 0x5da048 })
        );
        mesh.position.set(cx * 10, 5, cz * 10);
        group.add(mesh);
        this.scene.add(group);
        this.chunks.set(`${cx},${cz}`, group);
    }
};

window.UI = {
    show: (id) => {
        document.querySelectorAll('.overlay').forEach(l => l.classList.remove('active'));
        document.getElementById(id).classList.add('active');
        Game.isPlaying = false;
    },
    hideAll: () => {
        document.querySelectorAll('.overlay').forEach(l => l.classList.remove('active'));
        Game.isPlaying = true;
    },
    togglePause: () => this.show('menu-main')
};

Game.init();
