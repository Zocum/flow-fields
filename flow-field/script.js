const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');
// make width and height of canvas dynamic while still being divisible by cellSize without remainder
canvas.width = Math.floor(window.innerWidth / 10) * 10;
canvas.height = Math.floor(window.innerHeight / 10) * 10;

// canvas settings
ctx.fillStyle = '#fff';
ctx.strokeStyle = '#fff';
ctx.lineWidth = 1;

class Particle {
    constructor(effect) {
        this.effect = effect;
        this.x = Math.floor(Math.random() * this.effect.width);
        this.y = Math.floor(Math.random() * this.effect.height);
        this.speedX;
        this.speedY;
        this.speedModifier = Math.floor(Math.random() * .2 + 1);
        this.history = [{x: this.x, y: this.y}];
        this.maxLength = Math.floor(Math.random() * 200 + 10);
        this.angle = 0;
        this.timer = this.maxLength * 2;
        this.colors = ['#fcba03', '#035afc', '#fc03a5'];
        this.color = this.colors[2]
    }

    draw(context) {
        context.beginPath();
        context.moveTo(this.history[0].x, this.history[0].y);
        for (let i = 0; i < this.history.length; i++) {
            context.lineTo(this.history[i].x, this.history[i].y);
        }

        context.strokeStyle = this.color;
        context.stroke();
    }

    update() {
        this.timer--;
        if (this.timer >= 1) {
            let x = Math.floor(this.x / this.effect.cellSize);
            let y = Math.floor(this.y / this.effect.cellSize);
            let index = y * this.effect.cols + x;
            if (this.effect.flowField[index]) {
                this.angle = this.effect.flowField[index].colorAngle;
            }
            
    
            this.speedX = Math.cos(this.angle);
            this.speedY = Math.sin(this.angle);
            this.x += this.speedX * this.speedModifier;
            this.y += this.speedY * this.speedModifier;
    
            this.history.push({x: this.x, y: this.y});
            if (this.history.length > this.maxLength) {
                this.history.shift();
            }
        } else if (this.history.length > 1) {
            this.history.shift();

        } else {
            this.reset();
        }
    }

    reset() {
        this.x = Math.floor(Math.random() * this.effect.width);
        this.y = Math.floor(Math.random() * this.effect.height);
        this.history = [{x: this.x, y: this.y}];
        this.timer = this.maxLength * 2;
    }
}

class Effect {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.context = ctx;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.particles = [];
        this.numberOfParticles = 2000;
        this.cellSize = 5;
        this.rows;
        this.cols;
        this.flowField = [];
        this.curve = 5;
        this.zoom = 0.07;
        this.debug = true;
        this.init();

        window.addEventListener('keydown', e => {
            if (e.key === 'd') this.debug = !this.debug;
        });

        window.addEventListener('resize', e => {
            this.resize(e.target.innerWidth, e.target.innerHeight);
        })
    }

    init() {
        this.initFLowField();
        this.initParticles();
    }

    drawText() {
        this.context.font = '500px Impact';
        this.context.textAlign = 'center';
        this.context.textBaseline = 'middle';  
        const gradient1 = this.context.createLinearGradient(0, 0, this.width, this.height);
        gradient1.addColorStop(0.2, 'rgb(255, 0 ,0)');
        gradient1.addColorStop(0.4, 'rgb(0, 255, 0)');
        gradient1.addColorStop(0.6, 'rgb(150,100,100)');
        gradient1.addColorStop(0.8, 'rgb(0,255,255)');

        const gradient2 = this.context.createLinearGradient(0, 0, this.width, this.height);
        gradient2.addColorStop(0.2, 'rgb(255, 255 ,0)');
        gradient2.addColorStop(0.4, 'rgb(200, 5, 50)');
        gradient2.addColorStop(0.6, 'rgb(150, 255, 255)');
        gradient2.addColorStop(0.8, 'rgb(255,255, 150)');

        this.context.fillStyle = gradient2;
        this.context.fillText('JS', this.width * 0.5, this.height * 0.5, this.width * 0.8);
    }

    initFLowField() {
        // create flow field
        this.rows = Math.floor(this.height / this.cellSize);
        this.cols = Math.floor(this.width / this.cellSize);
        this.flowField = [];

        // draw text
        this.drawText();

        // scan pixel data
        let pixels = this.context.getImageData(0, 0, this.width, this.height);
        // let data = pixels.data;
        console.log(pixels)

        for (let y = 0; y < this.height; y += this.cellSize) {
            for (let x = 0; x < this.width; x += this.cellSize) {
                let index = (x + y * this.width) * 4;
                let r = pixels.data[index];
                let g = pixels.data[index + 1];
                let b = pixels.data[index + 2];
                let a = pixels.data[index + 3];
                const grayscale = (r + g + b) / 3;
                const colorAngle = ((grayscale / 255) * (Math.PI * 2)).toFixed(2);
                this.flowField.push({
                    colorAngle: colorAngle,
                    x: x,
                    y: y});
                // if (r === 255 && g === 255 && b === 255 && a === 255) {
                //     this.flowField.push(0);
                // } else {
                //     this.flowField.push(1);
                // }
            }
        }
        console.log(this.flowField)
        // let index = 0;

        // for (let y = 0; y < this.rows; y++) {
        //     for (let x = 0; x < this.cols; x++) {
        //         let angle = (Math.sin(x * this.zoom) + Math.cos(y * this.zoom)) * this.curve;
        //         this.flowField.push(angle);
        //     }
        // }
    }

    initParticles() {
        // create particles
        this.particles = [];
        for (let c = 0; c < this.numberOfParticles; c++) {
            this.particles.push(new Particle(this));
        }
    }

    drawGrid() {
        this.context.save();
        this.context.strokeStyle = 'red';
        for (let c = 0; c < this.cols; c++) {
            this.context.beginPath();
            this.context.moveTo(this.cellSize * c, 0);
            this.context.lineTo(this.cellSize * c, this.height);
            this.context.stroke();
        }

        for (let r = 0; r < this.rows; r++) {
            this.context.beginPath();
            this.context.moveTo(0, this.cellSize * r);
            this.context.lineTo(this.width, this.cellSize * r);
            this.context.stroke();
        }
        this.context.restore();
    }

    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        this.initParticles();
    }

    render() {
       if (this.debug) {
            this.drawGrid();
            this.drawText();
        }
       this.drawText();
        this.particles.forEach(particle => {
            particle.draw(this.context);
            particle.update();
        })
    }
}

const effect = new Effect(canvas, ctx);
console.log(effect)

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    effect.render();
    requestAnimationFrame(animate);
}

animate();