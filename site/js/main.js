gsap.registerPlugin(ScrollTrigger);

/* ---------- Smooth scroll (Lenis) wired to GSAP ScrollTrigger ---------- */
const lenis = new Lenis({
  duration: 1.1,
  easing: (t) => 1 - Math.pow(1 - t, 3),
  smoothWheel: true,
});

lenis.on('scroll', ScrollTrigger.update);

gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

/* ---------- Navbar background on scroll ---------- */
const navbar = document.getElementById('navbar');
ScrollTrigger.create({
  start: 'top -80',
  end: 99999,
  onUpdate: (self) => {
    navbar.classList.toggle('scrolled', self.scroll() > 80);
  },
});

/* ---------- Hero scroll-scrubbed video ---------- */
const heroVideo = document.getElementById('hero-video');

/* Pin the hero immediately so the layout/scroll-jack is stable even if the
   video is slow to load or fails; the actual frame-scrubbing only kicks in
   once duration is known (guarded inside onUpdate). */
ScrollTrigger.create({
  trigger: '#hero',
  start: 'top top',
  end: '+=220%',
  pin: true,
  scrub: 0.6,
  onUpdate: (self) => {
    const duration = heroVideo.duration || 0;
    if (!duration || Number.isNaN(duration)) return;
    heroVideo.currentTime = self.progress * duration;
  },
});

/* ---------- Scroll reveal for generic sections ---------- */
gsap.utils.toArray('.stat-card, .tilt-card, .income-card').forEach((el, i) => {
  gsap.fromTo(
    el,
    { opacity: 0, y: 40 },
    {
      opacity: 1,
      y: 0,
      duration: 0.7,
      delay: (i % 6) * 0.05,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 88%',
      },
    }
  );
});

gsap.utils.toArray('.eyebrow, .section-title, .section-desc').forEach((el) => {
  gsap.fromTo(
    el,
    { opacity: 0, y: 24 },
    {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 90%',
      },
    }
  );
});

/* ---------- Roadmap steps: 3D reveal ---------- */
gsap.utils.toArray('.roadmap-step').forEach((step, i) => {
  gsap.fromTo(
    step,
    { opacity: 0, y: 60, rotateX: 10 },
    {
      opacity: 1,
      y: 0,
      rotateX: 0,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: step,
        start: 'top 82%',
      },
    }
  );

  const num = step.querySelector('.roadmap-num');
  gsap.fromTo(
    num,
    { scale: 0.4, opacity: 0 },
    {
      scale: 1,
      opacity: 1,
      duration: 0.6,
      delay: 0.15,
      ease: 'back.out(2)',
      scrollTrigger: {
        trigger: step,
        start: 'top 82%',
      },
    }
  );
});

/* ---------- Animated counters ---------- */
document.querySelectorAll('.stat-number').forEach((el) => {
  const target = parseFloat(el.dataset.count || '0');
  const suffix = el.dataset.suffix || '';
  const toPersianDigits = (n) =>
    n.toString().replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);

  ScrollTrigger.create({
    trigger: el,
    start: 'top 90%',
    once: true,
    onEnter: () => {
      const obj = { val: 0 };
      gsap.to(obj, {
        val: target,
        duration: 1.6,
        ease: 'power2.out',
        onUpdate: () => {
          el.textContent = toPersianDigits(Math.round(obj.val)) + suffix;
        },
      });
    },
  });
});

/* ---------- 3D tilt on feature cards ---------- */
document.querySelectorAll('.tilt-card').forEach((card) => {
  const maxTilt = 10;

  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    gsap.to(card, {
      rotateY: x * maxTilt * 2,
      rotateX: -y * maxTilt * 2,
      duration: 0.4,
      ease: 'power2.out',
      transformPerspective: 800,
    });
  });

  card.addEventListener('mouseleave', () => {
    gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.6, ease: 'power3.out' });
  });
});

/* ---------- FAQ accordion ---------- */
document.querySelectorAll('.faq-item').forEach((item) => {
  const question = item.querySelector('.faq-question');
  const answer = item.querySelector('.faq-answer');

  question.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');

    document.querySelectorAll('.faq-item.open').forEach((openItem) => {
      if (openItem !== item) {
        openItem.classList.remove('open');
        openItem.querySelector('.faq-answer').style.maxHeight = null;
      }
    });

    item.classList.toggle('open', !isOpen);
    answer.style.maxHeight = !isOpen ? answer.scrollHeight + 'px' : null;
  });
});

/* ---------- Three.js neural-network background ---------- */
(function initBackground() {
  const canvas = document.getElementById('bg-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 60;

  const COUNT = 140;
  const positions = new Float32Array(COUNT * 3);
  const velocities = [];

  for (let i = 0; i < COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 140;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 140;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 80;
    velocities.push({
      x: (Math.random() - 0.5) * 0.03,
      y: (Math.random() - 0.5) * 0.03,
      z: (Math.random() - 0.5) * 0.03,
    });
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  function makeDotTexture() {
    const size = 64;
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d');
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.4, 'rgba(255,255,255,0.6)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(c);
  }

  const pointsMaterial = new THREE.PointsMaterial({
    color: 0x8c7bff,
    size: 2.2,
    map: makeDotTexture(),
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geometry, pointsMaterial);
  scene.add(points);

  const lineGeometry = new THREE.BufferGeometry();
  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x4fd6ff,
    transparent: true,
    opacity: 0.15,
  });
  const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
  scene.add(lines);

  const MAX_DIST = 22;

  function updateLines() {
    const linePositions = [];
    for (let i = 0; i < COUNT; i++) {
      for (let j = i + 1; j < COUNT; j++) {
        const dx = positions[i * 3] - positions[j * 3];
        const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
        const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < MAX_DIST) {
          linePositions.push(
            positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2],
            positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]
          );
        }
      }
    }
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
  }

  let mouseX = 0;
  let mouseY = 0;
  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  let scrollProgress = 0;
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      scrollProgress = self.progress;
    },
  });

  let frame = 0;
  function animate() {
    requestAnimationFrame(animate);
    frame++;

    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] += velocities[i].x;
      positions[i * 3 + 1] += velocities[i].y;
      positions[i * 3 + 2] += velocities[i].z;

      if (Math.abs(positions[i * 3]) > 70) velocities[i].x *= -1;
      if (Math.abs(positions[i * 3 + 1]) > 70) velocities[i].y *= -1;
      if (Math.abs(positions[i * 3 + 2]) > 40) velocities[i].z *= -1;
    }
    geometry.attributes.position.needsUpdate = true;

    if (frame % 4 === 0) updateLines();

    points.rotation.y = scrollProgress * Math.PI * 0.6 + mouseX * 0.15;
    points.rotation.x = mouseY * 0.1;
    lines.rotation.copy(points.rotation);

    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();

/* ---------- Smooth anchor links (works with Lenis) ---------- */
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (e) => {
    const targetId = anchor.getAttribute('href');
    if (targetId.length <= 1) return;
    const target = document.querySelector(targetId);
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target, { duration: 1.4 });
  });
});
