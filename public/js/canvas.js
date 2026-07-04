// Interactive Mechanical Blueprint Node Animation Script
function initMechanicalAnimation() {
  const canvas = document.getElementById('mechanical-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const container = canvas.parentElement;

  let width = canvas.width = container.offsetWidth;
  let height = canvas.height = container.offsetHeight;

  const totalNodes = 45;
  const nodes = [];
  let mouse = { x: null, y: null, radius: 140 };

  window.addEventListener('resize', () => {
    width = canvas.width = container.offsetWidth;
    height = canvas.height = container.offsetHeight;
  });

  container.addEventListener('mousemove', (e) => {
    const bounds = container.getBoundingClientRect();
    mouse.x = e.clientX - bounds.left;
    mouse.y = e.clientY - bounds.top;
  });

  container.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
  });

  class VectorNode {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = (Math.random() - 0.5) * 0.4;
      this.baseRadius = Math.random() * 2 + 1.5;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;

      if (mouse.x && mouse.y) {
        let dx = this.x - mouse.x;
        let dy = this.y - mouse.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouse.radius) {
          let force = (mouse.radius - dist) / mouse.radius;
          this.x += (dx / dist) * force * 1.5;
          this.y += (dy / dist) * force * 1.5;
        }
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.baseRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#0f2b5c';
      ctx.fill();
    }
  }

  for (let i = 0; i < totalNodes; i++) {
    nodes.push(new VectorNode());
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(15, 43, 92, 0.03)';
    ctx.lineWidth = 1;
    const gridGap = 60;
    for (let x = 0; x < width; x += gridGap) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += gridGap) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        let dx = nodes[i].x - nodes[j].x;
        let dy = nodes[i].y - nodes[j].y;
        let dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 130) {
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = `rgba(15, 43, 92, ${0.12 * (1 - dist / 130)})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }

    nodes.forEach(node => {
      node.update();
      node.draw();
    });

    requestAnimationFrame(animate);
  }
  animate();
}

if (document.readyState === 'complete') {
  initMechanicalAnimation();
} else {
  window.addEventListener('load', initMechanicalAnimation);
}
