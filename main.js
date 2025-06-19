// COINSオブジェクトの定義
const COINS = {
    '1': { 
        radius: 22,  // 20 * 1.1
        value: '1円', 
        color: '#C0C0C0',
        image: './1yen.png'
    },
    '5': { 
        radius: 26,  // 24 * 1.1
        value: '5円', 
        color: '#DAA520',
        image: './5yen.png'
    },
    '10': { 
        radius: 31,  // 28 * 1.1
        value: '10円', 
        color: '#CD7F32',
        image: './10yen.png'
    },
    '50': { 
        radius: 35,  // 32 * 1.1
        value: '50円', 
        color: '#C0C0C0',
        image: './50yen.png'
    },
    '100': { 
        radius: 40,  // 36 * 1.1
        value: '100円', 
        color: '#DAA520',
        image: './100yen.png'
    },
    '500': { 
        radius: 44,  // 40 * 1.1
        value: '500円', 
        color: '#C0C0C0',
        image: './500yen.png'
    },
    '1000': { 
        radius: 50,  // 45 * 1.1
        value: '1000円', 
        color: '#98FB98',
        image: './1000yen.png'
    },
    '5000': { 
        radius: 55,  // 50 * 1.1
        value: '5000円', 
        color: '#BA55D3',
        image: './5000yen.png'
    },
    '10000': { 
        radius: 61,  // 55 * 1.1
        value: '10000円', 
        color: '#4169E1',
        image: './10000yen.png'
    }
};

// 画像読み込み関数
const loadImage = (src) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        console.log(`画像読み込み開始: ${src}`);
        
        img.onload = () => {
            console.log(`画像読み込み成功: ${src}`);
            resolve(img);
        };
        
        img.onerror = (e) => {
            console.error(`画像読み込み失敗: ${src}`, e);
            reject(e);
        };

        img.src = src;
    });
};

// Matter.jsの読み込み
const script = document.createElement('script');
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.19.0/matter.min.js';
document.head.appendChild(script);

script.onload = async () => {
    // Matter.jsのモジュールを取得
    const { Engine, Render, Runner, Bodies, World, Body, Events, Composite } = Matter;

    // 画像の事前読み込み
    const coinImages = {};
    try {
        for (const [key, coin] of Object.entries(COINS)) {
            coinImages[key] = await loadImage(coin.image);
        }
    } catch (error) {
        console.warn('画像の読み込みに失敗しました:', error);
    }

    // ゲーム状態の管理
    let dropPosition = 300;  // 中央から開始
    let moveDirection = 1;
    let moveSpeed = 3;
    let canDrop = true;
    let nextCoin = null;
    let nextCoinValue = null;
    let isGameOver = false;

    // エンジンの初期化
    const canvas = document.getElementById('canvas');
    const engine = Engine.create();
    const render = Render.create({
        canvas: canvas,
        engine: engine,
        options: {
            width: 600,
            height: 800,
            wireframes: false,
            background: '#f0f0f0'
        }
    });

    // 物理演算の設定
    engine.world.gravity.y = 0.5;
    engine.world.gravity.scale = 0.001;

    // 壁の作成
    const walls = [
        Bodies.rectangle(300, 810, 610, 60, {
            isStatic: true,
            friction: 1,
            render: { fillStyle: '#666666' }
        }),
        Bodies.rectangle(-10, 400, 60, 800, {
            isStatic: true,
            friction: 0.8,
            render: { fillStyle: '#666666' }
        }),
        Bodies.rectangle(610, 400, 60, 800, {
            isStatic: true,
            friction: 0.8,
            render: { fillStyle: '#666666' }
        })
    ];
    World.add(engine.world, walls);

    // ゲームオーバーラインの追加
    const gameOverLine = Bodies.rectangle(300, 80, 600, 2, {  // 800 * 0.1 = 80
        isStatic: true,
        isSensor: true,
        render: { 
            fillStyle: 'red',
            opacity: 0.5
        },
        label: 'gameOverLine'
    });
    World.add(engine.world, gameOverLine);

    // UIの作成
    const nextCoinDisplay = document.createElement('div');
    nextCoinDisplay.style.position = 'fixed';
    nextCoinDisplay.style.top = '20px';
    nextCoinDisplay.style.left = '20px';
    nextCoinDisplay.style.padding = '10px';
    nextCoinDisplay.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    nextCoinDisplay.style.border = '2px solid #666';
    nextCoinDisplay.style.borderRadius = '5px';
    nextCoinDisplay.style.display = 'flex';
    nextCoinDisplay.style.alignItems = 'center';
    nextCoinDisplay.style.gap = '10px';
    document.body.appendChild(nextCoinDisplay);

    const nextLabel = document.createElement('span');
    nextLabel.textContent = 'NEXT';
    nextLabel.style.fontWeight = 'bold';
    nextCoinDisplay.appendChild(nextLabel);

    const nextCoinImage = document.createElement('img');
    nextCoinImage.style.width = '40px';
    nextCoinImage.style.height = '40px';
    nextCoinDisplay.appendChild(nextCoinImage);

    // ドロップボタンの作成
    const dropButton = document.createElement('button');
    dropButton.textContent = '落とす';
    dropButton.style.position = 'fixed';
    dropButton.style.top = '20px';
    dropButton.style.right = '20px';
    dropButton.style.padding = '10px 20px';
    dropButton.style.fontSize = '16px';
    dropButton.style.cursor = 'pointer';
    document.body.appendChild(dropButton);

    // コイン作成関数
    function createCoin(x, y, value, isSensor = false) {
        const coin = COINS[value];
        const options = {
            restitution: 0.3,
            friction: 0.8,
            density: 0.001,
            label: value.toString(),
            render: {},
            isSensor: isSensor,
            collisionFilter: {
                category: isSensor ? 0x0002 : 0x0001,
                mask: isSensor ? 0x0000 : 0xFFFF
            },
            angularVelocity: 0,
            torque: 0,
            frictionAir: 0.001
        };

        const img = coinImages[value];
        if (img && img.complete) {
            const isNote = parseInt(value) >= 1000;
            const scale = isNote ? 2.1 : 1;
            options.render.sprite = {
                texture: img.src,
                xScale: (coin.radius * 2 * scale) / img.width,
                yScale: (coin.radius * 2 * scale) / img.height
            };

            if (isNote) {
                return Bodies.rectangle(
                    x, y,
                    coin.radius * 5.0,
                    coin.radius * 2.5,
                    options
                );
            }
        }
        return Bodies.circle(x, y, coin.radius, options);
    }

    // ゲーム機能の実装
    function getRandomCoinValue() {
        const initialCoins = ['1', '5', '10', '50', '100'];
        return initialCoins[Math.floor(Math.random() * initialCoins.length)];
    }

    function createNextCoin() {
        const randomValue = getRandomCoinValue();
        nextCoin = createCoin(dropPosition, 50, nextCoinValue || randomValue, true);
        World.add(engine.world, nextCoin);
        Body.setStatic(nextCoin, true);
        
        nextCoinValue = randomValue;
        nextCoinImage.src = COINS[nextCoinValue].image;
    }

    function dropCoin() {
        if (!canDrop || !nextCoin || isGameOver) return;
        canDrop = false;

        const position = { x: nextCoin.position.x, y: nextCoin.position.y };
        const currentValue = nextCoin.label;

        World.remove(engine.world, nextCoin);
        nextCoin = null;

        const droppedCoin = createCoin(position.x, position.y, currentValue, false);
        World.add(engine.world, droppedCoin);
        
        createNextCoin();
        
        setTimeout(() => { canDrop = true; }, 200);
    }

    function updateDropPosition() {
        if (dropPosition >= 500) {
            moveDirection = -1;
        } else if (dropPosition <= 100) {
            moveDirection = 1;
        }
        dropPosition += moveSpeed * moveDirection;
        if (nextCoin) {
            Body.setPosition(nextCoin, {
                x: dropPosition,
                y: 50
            });
        }
    }

    function checkGameOver() {
        const allBodies = Composite.allBodies(engine.world);
        for (let body of allBodies) {
            if (body.label !== 'gameOverLine' && 
                !body.isStatic && 
                body.velocity.y < 0.1 && 
                body.position.y < 80) {  // 160から80に変更
            
                if (!body.lastHighPosition) {
                    body.lastHighPosition = Date.now();
                } else if (Date.now() - body.lastHighPosition > 1000) {
                    if (!isGameOver) {
                        showGameOver();
                    }
                    return;
                }
            } else {
                body.lastHighPosition = null;
            }
        }
    }

    function showGameOver() {
        isGameOver = true;
        const gameOverDisplay = document.createElement('div');
        gameOverDisplay.style.position = 'fixed';
        gameOverDisplay.style.top = '50%';
        gameOverDisplay.style.left = '50%';
        gameOverDisplay.style.transform = 'translate(-50%, -50%)';
        gameOverDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        gameOverDisplay.style.color = 'white';
        gameOverDisplay.style.padding = '20px';
        gameOverDisplay.style.borderRadius = '10px';
        gameOverDisplay.style.fontSize = '24px';
        gameOverDisplay.style.textAlign = 'center';
        gameOverDisplay.innerHTML = 'GAME OVER<br><span style="font-size: 16px">スペースキーでリトライ</span>';
        document.body.appendChild(gameOverDisplay);
    }

    // イベントリスナーの設定
    dropButton.addEventListener('click', dropCoin);
    document.addEventListener('keydown', (event) => {
        if (event.key === ' ') {
            if (isGameOver) {
                location.reload();
            } else {
                dropCoin();
            }
        }
    });

    // 衝突検出
    Events.on(engine, 'collisionStart', (event) => {
        event.pairs.forEach((pair) => {
            const { bodyA, bodyB } = pair;
            if (bodyA.label === bodyB.label && 
                !bodyA.isStatic && !bodyB.isStatic && 
                !bodyA.isProcessing && !bodyB.isProcessing) {
                
                bodyA.isProcessing = true;
                bodyB.isProcessing = true;

                const currentValue = parseInt(bodyA.label);
                let nextValue;
                
                if (currentValue === 1) nextValue = 5;
                else if (currentValue === 5) nextValue = 10;
                else if (currentValue === 10) nextValue = 50;
                else if (currentValue === 50) nextValue = 100;
                else if (currentValue === 100) nextValue = 500;
                else if (currentValue === 500) nextValue = 1000;
                else if (currentValue === 1000) nextValue = 5000;
                else if (currentValue === 5000) nextValue = 10000;

                World.remove(engine.world, [bodyA, bodyB]);

                if (currentValue === 10000) {
                    console.log('10000円玉が消滅しました！');
                    return;
                }

                if (COINS[nextValue]) {
                    const pos = {
                        x: (bodyA.position.x + bodyB.position.x) / 2,
                        y: (bodyA.position.y + bodyB.position.y) / 2
                    };
                    const newCoin = createCoin(pos.x, pos.y, nextValue.toString());
                    World.add(engine.world, newCoin);
                }
            }
        });
    });

    // ゲームループ
    function gameLoop() {
        if (!isGameOver && canDrop) {
            updateDropPosition();
        }
        checkGameOver();
        requestAnimationFrame(gameLoop);
    }

    // ゲーム開始
    createNextCoin();
    gameLoop();
    Engine.run(engine);
    Render.run(render);
};
