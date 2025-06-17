// 硬貨の種類とサイズの定義
const COINS = {
    '1': { 
        radius: 20, 
        value: '1円', 
        color: '#C0C0C0',
        image: './1yen.png'
    },
    '5': { 
        radius: 25, 
        value: '5円', 
        color: '#DAA520',
        image: './5yen.png'
    },
    '10': { 
        radius: 30, 
        value: '10円', 
        color: '#CD7F32',
        image: './10yen.png'
    },
    '50': { 
        radius: 35, 
        value: '50円', 
        color: '#C0C0C0',
        image: './50yen.png'
    },
    '100': { 
        radius: 40, 
        value: '100円', 
        color: '#DAA520',
        image: './100yen.png'
    },
    '500': { 
        radius: 45, 
        value: '500円', 
        color: '#C0C0C0',
        image: './500yen.png'
    },
    '1000': { 
        radius: 50, 
        value: '1000円', 
        color: '#98FB98',
        image: './1000yen.png'
    },
    '5000': { 
        radius: 55, 
        value: '5000円', 
        color: '#BA55D3',
        image: './5000yen.png'
    },
    '10000': { 
        radius: 60, 
        value: '10000円', 
        color: '#4169E1',
        image: './10000yen.png'
    }
};

// 画像読み込み関数を修正
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

        // file://プロトコルを削除し、相対パスで読み込む
        img.src = src;
    });
};

// Matter.jsの読み込み
const script = document.createElement('script');
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.19.0/matter.min.js';
document.head.appendChild(script);

script.onload = async () => {
    // 画像の事前読み込みを修正
    const coinImages = {};
    try {
        for (const [key, coin] of Object.entries(COINS)) {
            console.log(`${coin.value}の画像読み込みを試行...`);
            coinImages[key] = await loadImage(coin.image);
            console.log(`${coin.value}の画像読み込み完了`);
        }
        console.log('全ての画像の読み込みが完了しました');
    } catch (error) {
        console.warn('画像の読み込みに失敗しました:', error);
    }

    // コインを作成する関数を修正
    function createCoin(x, y, value) {
        const coin = COINS[value];
        const options = {
            restitution: 0.3,
            friction: 0.8,
            density: 0.002,
            label: value.toString(),
            render: {}
        };

        const img = coinImages[value];
        if (img && img.complete) {
            options.render.sprite = {
                texture: img.src,  // coin.imageではなくimg.srcを使用
                xScale: (coin.radius * 2) / img.width,
                yScale: (coin.radius * 2) / img.height
            };
        } else {
            options.render.fillStyle = coin.color;
            console.warn(`${coin.value}の画像が利用できないためフォールバック色を使用`);
        }

        return Bodies.circle(x, y, coin.radius, options);
    }

    const { Engine, Render, Runner, Bodies, World, Body, Events } = Matter;

    const canvas = document.getElementById('canvas');
    const engine = Engine.create();
    const runner = Runner.create();
    
    const render = Render.create({
        canvas: canvas,
        engine: engine,
        options: {
            width: 800,
            height: 600,
            wireframes: false,
            background: '#f0f0f0'
        }
    });

    // エンジン設定を追加（engine.create()の後に追加）
    engine.world.gravity.y = 2;   // 重力を適度に設定
    engine.world.gravity.scale = 0.001; // 重力のスケールを調整

    // 壁の作成
    const walls = [
        Bodies.rectangle(400, 610, 810, 60, { 
            isStatic: true,
            friction: 1,          // 摩擦を増やす
            render: { fillStyle: '#666666' }
        }), // 底
        Bodies.rectangle(-10, 300, 60, 600, { 
            isStatic: true,
            friction: 0.8,        // 摩擦を増やす
            render: { fillStyle: '#666666' }
        }), // 左
        Bodies.rectangle(810, 300, 60, 600, { 
            isStatic: true,
            friction: 0.8,        // 摩擦を増やす
            render: { fillStyle: '#666666' }
        }), // 右
    ];
    World.add(engine.world, walls);

    
    let dropPosition = 400;  // 初期位置
    let moveDirection = 1;   // 移動方向 (1: 右, -1: 左)
    let moveSpeed = 3;       // 移動速度
    let canDrop = true;
    let nextCoin = null;

    // コインの自動移動を制御
    function updateDropPosition() {
        if (dropPosition >= 700) {
            moveDirection = -1;
        } else if (dropPosition <= 100) {
            moveDirection = 1;
        }
        dropPosition += moveSpeed * moveDirection;
        moveNextCoin();
    }

    // アニメーションループを追加
    function gameLoop() {
        if (canDrop) {  // ドロップ待機中の時だけ移動
            updateDropPosition();
        }
        requestAnimationFrame(gameLoop);
    }

    // ドロップボタンの作成と配置
    const dropButton = document.createElement('button');
    dropButton.textContent = '落とす';
    dropButton.style.position = 'fixed';
    dropButton.style.top = '20px';
    dropButton.style.right = '20px';
    dropButton.style.padding = '10px 20px';
    dropButton.style.fontSize = '16px';
    dropButton.style.cursor = 'pointer';
    document.body.appendChild(dropButton);

    // ボタンクリックイベントの追加
    dropButton.addEventListener('click', () => {
        if (canDrop) {
            dropCoin();
        }
    });

    // キーボード操作（スペースキーでもドロップ可能）
    document.addEventListener('keydown', (event) => {
        if (event.key === ' ' && canDrop) {
            dropCoin();
        }
    });

    // コインの移動を制御する関数を追加
    function moveNextCoin() {
        if (nextCoin) {
            Body.setPosition(nextCoin, {
                x: dropPosition,
                y: 50
            });
        }
    }

    // コインを作成する関数を修正
    function createNextCoin() {
        nextCoin = createCoin(dropPosition, 50, '1');
        World.add(engine.world, nextCoin);
        Body.setStatic(nextCoin, true);  // 静的にして落ちないようにする
    }

    // コインを落とす関数を修正（待ち時間を短縮）
    function dropCoin() {
        if (!canDrop || !nextCoin) return;
        canDrop = false;

        const currentCoin = nextCoin;  // 現在のコインを保存
        nextCoin = null;  // nextCoinをクリア

        // コインを動的にして落下させる
        Body.setStatic(currentCoin, false);
        
        // すぐに次のコインを準備
        createNextCoin();
        
        // 待ち時間を200msに短縮
        setTimeout(() => {
            canDrop = true;
        }, 200);  // 500から200に変更
    }

    // 衝突の検出を修正（衝突したコインを消去するように変更）
    Events.on(engine, 'collisionStart', (event) => {
        event.pairs.forEach((pair) => {
            const { bodyA, bodyB } = pair;
            if (bodyA.label === bodyB.label && 
                !bodyA.isStatic && !bodyB.isStatic && 
                !bodyA.isProcessing && !bodyB.isProcessing) {
                
                // 重複処理を防ぐためのフラグを設定
                bodyA.isProcessing = true;
                bodyB.isProcessing = true;

                const currentValue = parseInt(bodyA.label);
                let nextValue;
                
                // 進化のルール設定
                if (currentValue === 1) nextValue = 5;
                else if (currentValue === 5) nextValue = 10;
                else if (currentValue === 10) nextValue = 50;
                else if (currentValue === 50) nextValue = 100;
                else if (currentValue === 100) nextValue = 500;
                else if (currentValue === 500) nextValue = 1000;
                else if (currentValue === 1000) nextValue = 5000;
                else if (currentValue === 5000) nextValue = 10000;

                if (COINS[nextValue]) {
                    const pos = {
                        x: (bodyA.position.x + bodyB.position.x) / 2,
                        y: (bodyA.position.y + bodyB.position.y) / 2
                    };

                    // まず衝突した2つのコインを削除
                    World.remove(engine.world, [bodyA, bodyB]);

                    // その後、新しい値のコインを追加
                    const newCoin = createCoin(pos.x, pos.y, nextValue.toString());
                    World.add(engine.world, newCoin);
                }
            }
        });
    });

    // ゲームを初期化
    createNextCoin();
    gameLoop();
    
    Engine.run(engine);
    Render.run(render);
};
