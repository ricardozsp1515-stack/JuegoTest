class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // Estado del juego
        this.gameState = 'playing'; // playing, victory, defeat
        this.lives = 3;
        this.level = 1;
        
        // Jugador
        this.player = {
            x: 50,
            y: this.height - 80,
            width: 30,
            height: 30,
            velocityX: 0,
            velocityY: 0,
            speed: 5,
            jumpPower: 12,
            onGround: false,
            color: '#4CAF50'
        };
        
        // Plataformas
        this.platforms = [
            // Plataforma del suelo
            { x: 0, y: this.height - 20, width: this.width, height: 20, color: '#8B4513' },
            // Plataformas flotantes
            { x: 120, y: this.height - 80, width: 80, height: 15, color: '#8B4513' },
            { x: 250, y: this.height - 130, width: 100, height: 15, color: '#8B4513' },
            { x: 400, y: this.height - 100, width: 80, height: 15, color: '#8B4513' },
            { x: 530, y: this.height - 150, width: 80, height: 15, color: '#8B4513' }
        ];
        
        // Atacantes
        this.enemies = [
            { x: 160, y: this.height - 40, width: 25, height: 25, velocityX: 2, color: '#f44336', minX: 120, maxX: 200 },
            { x: 290, y: this.height - 155, width: 25, height: 25, velocityX: -1.5, color: '#f44336', minX: 250, maxX: 350 },
            { x: 440, y: this.height - 125, width: 25, height: 25, velocityX: 2.5, color: '#f44336', minX: 400, maxX: 480 },
            { x: 560, y: this.height - 175, width: 25, height: 25, velocityX: -2, color: '#f44336', minX: 530, maxX: 610 }
        ];
        
        // Meta (lado derecho)
        this.goal = {
            x: this.width - 40,
            y: this.height - 60,
            width: 35,
            height: 40,
            color: '#FFD700'
        };
        
        // Controles
        this.keys = {};
        this.setupEventListeners();
        
        // Iniciar juego
        this.gameLoop();
    }
    
    setupEventListeners() {
        // Capturar teclas para el juego y prevenir scroll
        document.addEventListener('keydown', (e) => {
            // Prevenir scroll
            if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
                e.stopPropagation();
            }
            
            // Guardar tecla para el juego
            this.keys[e.key] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            // Prevenir scroll
            if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
                e.stopPropagation();
            }
            
            // Liberar tecla
            this.keys[e.key] = false;
        });
        
        // Botón de reinicio
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restart();
        });
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        // Actualizar jugador
        this.updatePlayer();
        
        // Actualizar enemigos
        this.updateEnemies();
        
        // Verificar colisiones
        this.checkCollisions();
        
        // Verificar victoria
        this.checkVictory();
    }
    
    updatePlayer() {
        // Movimiento horizontal
        if (this.keys['ArrowLeft']) {
            this.player.velocityX = -this.player.speed;
        } else if (this.keys['ArrowRight']) {
            this.player.velocityX = this.player.speed;
        } else {
            this.player.velocityX *= 0.8; // Fricción
        }
        
        // Salto - permitir saltar con flecha arriba o espacio
        if ((this.keys['ArrowUp'] || this.keys[' ']) && this.player.onGround) {
            this.player.velocityY = -this.player.jumpPower;
            this.player.onGround = false;
        }
        
        // Gravedad
        this.player.velocityY += 0.5;
        
        // Actualizar posición
        this.player.x += this.player.velocityX;
        this.player.y += this.player.velocityY;
        
        // Límites del canvas
        if (this.player.x < 0) this.player.x = 0;
        if (this.player.x + this.player.width > this.width) {
            this.player.x = this.width - this.player.width;
        }
        
        // Verificar si está en el suelo primero
        this.player.onGround = false;
        
        // Evitar caer por debajo del suelo
        if (this.player.y + this.player.height >= this.height - 20) {
            this.player.y = this.height - 20 - this.player.height;
            this.player.velocityY = 0;
            this.player.onGround = true;
        }
        
        // Verificar colisiones con plataformas
        for (let platform of this.platforms) {
            if (this.checkPlatformCollision(this.player, platform)) {
                // Colisión desde arriba
                if (this.player.velocityY > 0 && 
                    this.player.y < platform.y) {
                    this.player.y = platform.y - this.player.height;
                    this.player.velocityY = 0;
                    this.player.onGround = true;
                }
                // Colisión desde abajo
                else if (this.player.velocityY < 0 && 
                         this.player.y > platform.y) {
                    this.player.y = platform.y + platform.height;
                    this.player.velocityY = 0;
                }
            }
        }
    }
    
    updateEnemies() {
        for (let enemy of this.enemies) {
            // Movimiento horizontal
            enemy.x += enemy.velocityX;
            
            // Cambiar dirección en los límites
            if (enemy.x <= enemy.minX || enemy.x + enemy.width >= enemy.maxX) {
                enemy.velocityX *= -1;
            }
            
            // Mantener dentro de los límites
            if (enemy.x < enemy.minX) enemy.x = enemy.minX;
            if (enemy.x + enemy.width > enemy.maxX) {
                enemy.x = enemy.maxX - enemy.width;
            }
        }
    }
    
    checkPlatformCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    checkCollisions() {
        // Colisión con enemigos
        for (let enemy of this.enemies) {
            if (this.checkPlatformCollision(this.player, enemy)) {
                this.loseLife();
                return;
            }
        }
    }
    
    checkVictory() {
        // Verificar si el jugador alcanzó la meta
        if (this.checkPlatformCollision(this.player, this.goal)) {
            this.victory();
        }
    }
    
    loseLife() {
        this.lives--;
        document.getElementById('lives').textContent = this.lives;
        
        if (this.lives <= 0) {
            this.defeat();
        } else {
            // Reiniciar posición del jugador
            this.player.x = 50;
            this.player.y = this.height - 80;
            this.player.velocityX = 0;
            this.player.velocityY = 0;
        }
    }
    
    victory() {
        this.gameState = 'victory';
        this.showMessage('¡Victoria!', 'victory');
    }
    
    defeat() {
        this.gameState = 'defeat';
        this.showMessage('¡Derrota!', 'defeat');
    }
    
    showMessage(text, type) {
        const messageEl = document.getElementById('gameMessage');
        messageEl.textContent = text;
        messageEl.className = `game-message ${type}`;
        messageEl.classList.remove('hidden');
    }
    
    restart() {
        // Reiniciar estado del juego
        this.gameState = 'playing';
        this.lives = 3;
        this.level = 1;
        
        // Reiniciar jugador
        this.player.x = 50;
        this.player.y = this.height - 80;
        this.player.velocityX = 0;
        this.player.velocityY = 0;
        
        // Reiniciar enemigos
        this.enemies = [
            { x: 160, y: this.height - 40, width: 25, height: 25, velocityX: 2, color: '#f44336', minX: 120, maxX: 200 },
            { x: 290, y: this.height - 155, width: 25, height: 25, velocityX: -1.5, color: '#f44336', minX: 250, maxX: 350 },
            { x: 440, y: this.height - 125, width: 25, height: 25, velocityX: 2.5, color: '#f44336', minX: 400, maxX: 480 },
            { x: 560, y: this.height - 175, width: 25, height: 25, velocityX: -2, color: '#f44336', minX: 530, maxX: 610 }
        ];
        
        // Actualizar UI
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('level').textContent = this.level;
        
        // Ocultar mensaje
        document.getElementById('gameMessage').classList.add('hidden');
    }
    
    draw() {
        // Limpiar canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Dibujar fondo
        this.drawBackground();
        
        // Dibujar plataformas
        for (let platform of this.platforms) {
            this.ctx.fillStyle = platform.color;
            this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            
            // Borde de las plataformas
            this.ctx.strokeStyle = '#654321';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
        }
        
        // Dibujar meta
        this.ctx.fillStyle = this.goal.color;
        this.ctx.fillRect(this.goal.x, this.goal.y, this.goal.width, this.goal.height);
        
        // Dibujar bandera en la meta
        this.ctx.fillStyle = '#FF0000';
        this.ctx.beginPath();
        this.ctx.moveTo(this.goal.x + 10, this.goal.y + 10);
        this.ctx.lineTo(this.goal.x + 35, this.goal.y + 20);
        this.ctx.lineTo(this.goal.x + 10, this.goal.y + 30);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Dibujar enemigos
        for (let enemy of this.enemies) {
            this.ctx.fillStyle = enemy.color;
            this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            
            // Ojos de los enemigos
            this.ctx.fillStyle = 'white';
            this.ctx.fillRect(enemy.x + 5, enemy.y + 5, 5, 5);
            this.ctx.fillRect(enemy.x + 15, enemy.y + 5, 5, 5);
            this.ctx.fillStyle = 'black';
            this.ctx.fillRect(enemy.x + 6, enemy.y + 6, 3, 3);
            this.ctx.fillRect(enemy.x + 16, enemy.y + 6, 3, 3);
        }
        
        // Dibujar jugador
        this.ctx.fillStyle = this.player.color;
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // Ojos del jugador
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(this.player.x + 5, this.player.y + 8, 6, 6);
        this.ctx.fillRect(this.player.x + 19, this.player.y + 8, 6, 6);
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(this.player.x + 7, this.player.y + 10, 2, 2);
        this.ctx.fillRect(this.player.x + 21, this.player.y + 10, 2, 2);
        
        // Debug info
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px Arial';
        this.ctx.fillText(`onGround: ${this.player.onGround}`, 10, 20);
        this.ctx.fillText(`ArrowUp: ${this.keys['ArrowUp']}`, 10, 35);
        this.ctx.fillText(`Space: ${this.keys[' ']}`, 10, 50);
        this.ctx.fillText(`Y: ${Math.round(this.player.y)}`, 10, 65);
    }
    
    drawBackground() {
        // Cielo
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.7, '#87CEEB');
        gradient.addColorStop(0.7, '#98D98E');
        gradient.addColorStop(1, '#98D98E');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Nubes simples
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.beginPath();
        this.ctx.arc(100, 50, 20, 0, Math.PI * 2);
        this.ctx.arc(130, 50, 25, 0, Math.PI * 2);
        this.ctx.arc(160, 50, 20, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.arc(500, 80, 18, 0, Math.PI * 2);
        this.ctx.arc(525, 80, 22, 0, Math.PI * 2);
        this.ctx.arc(550, 80, 18, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Iniciar el juego cuando se carga la página
window.addEventListener('load', () => {
    new Game();
});
