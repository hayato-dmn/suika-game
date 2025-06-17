// src/App.tsx

import React, { useState } from "react";
import { Bodies, Engine, Render, World, Runner } from "matter-js";
import { useEffect, useRef } from "react";

type CoinType = {
  id: number;
  value: number;
  x: number;
  y: number;
};

const COIN_VALUE = 1; // 1円硬貨
const MAX_MONEY = 100; // 落とせる最大金額

export default function App() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const [money, setMoney] = useState(0);
  const engineRef = useRef<Engine | null>(null);
  const [coins, setCoins] = useState<CoinType[]>([]);
  const coinIdRef = useRef(0);

  useEffect(() => {
    const engine = Engine.create();
    engineRef.current = engine;

    const render = Render.create({
      element: sceneRef.current!,
      engine: engine,
      options: {
        width: 400,
        height: 600,
        wireframes: false,
        background: "#a0d8f7",
      },
    });

    // 床（黒い横棒）
    const ground = Bodies.rectangle(200, 580, 400, 20, {
      isStatic: true,
      render: { fillStyle: "black" },
    });
    World.add(engine.world, [ground]);

    Render.run(render);
    const runner = Runner.create();
    Runner.run(runner, engine);

    return () => {
      Render.stop(render);
      Runner.stop(runner);
      render.canvas.remove();
      render.textures = {};
    };
  }, []);

  // クリックでコインを落とす
  const dropCoin = () => {
    if (money + COIN_VALUE > MAX_MONEY) return; // 100円超えたら落とさない

    setMoney((prev) => prev + COIN_VALUE);

    const id = coinIdRef.current++;
    const x = Math.random() * 360 + 20; // 少し横幅内にランダム
    const y = 0;

    const coinBody = Bodies.circle(x, y, 15, {
      restitution: 0.5,
      render: {
        sprite: {
          texture: "/coins/1yen.png", // 画像パスをここで指定
          xScale: 0.15,
          yScale: 0.15,
        },
      },
    });

    World.add(engineRef.current!.world, [coinBody]);

    // coins 配列に追加（表示用に id など管理）
    setCoins((coins) => [...coins, { id, value: COIN_VALUE, x, y }]);
  };

  return (
    <>
      <h1 style={{ textAlign: "center" }}>スイカゲーム - お金を落とそう</h1>
      <div
        ref={sceneRef}
        style={{
          margin: "0 auto",
          border: "1px solid #ccc",
          width: 400,
          height: 600,
          backgroundColor: "#a0d8f7",
        }}
      />
      <div style={{ textAlign: "center", marginTop: 10 }}>
        <button
          onClick={dropCoin}
          style={{
            padding: "10px 20px",
            fontSize: 16,
            cursor: money < MAX_MONEY ? "pointer" : "not-allowed",
          }}
          disabled={money >= MAX_MONEY}
        >
          お金を落とす (現在の合計: {money}円 / 最大 {MAX_MONEY}円)
        </button>
      </div>
    </>
  );
}
