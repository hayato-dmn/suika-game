import { useEffect, useRef } from "react";
import Matter from "matter-js";

function App() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);

  useEffect(() => {
    const engine = Matter.Engine.create();
    engineRef.current = engine;

    const render = Matter.Render.create({
      element: sceneRef.current!,
      engine: engine,
      options: {
        width: 800,
        height: 600,
        wireframes: false,
        background: "#D0E2F3",
      },
    });

    const ground = Matter.Bodies.rectangle(400, 590, 810, 20, {
      isStatic: true,
      render: { fillStyle: "#000000" },
    });

    Matter.World.add(engine.world, [ground]);
    Matter.Engine.run(engine);
    Matter.Render.run(render);

    return () => {
      Matter.Render.stop(render);
      Matter.World.clear(engine.world, false);
      Matter.Engine.clear(engine);
      render.canvas.remove();
    };
  }, []);

  const dropCoin = () => {
    if (!engineRef.current) return;

    const x = Math.random() * 700 + 50;
    const y = 0;

    const coin = Matter.Bodies.circle(x, y, 30, {
      restitution: 0.6,
      render: {
        sprite: {
          texture: "1yen.png", // public/coins/1yen.png に画像を置いてね
          xScale: 0.15,
          yScale: 0.15,
        },
      },
    });

    Matter.World.add(engineRef.current.world, [coin]);
  };

  return (
    <>
      <div ref={sceneRef} />
      <div style={{ position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)" }}>
        <button
          onClick={dropCoin}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            backgroundColor: "#EEEEEE",
            border: "1px solid #888",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          コインを落とす
        </button>
      </div>
    </>
  );
}

export default App;
