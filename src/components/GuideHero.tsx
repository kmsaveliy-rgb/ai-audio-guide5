import { useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Headphones, Map, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import videoAsset from "@/assets/guide-hero.mp4.asset.json";
import compatibleVideo from "@/assets/guide-hero.webm.asset.json";
import poster from "@/assets/guide-poster.jpg.asset.json";

export function GuideHero() {
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    element.muted = true;
    const resume = () => { void element.play().catch(() => {}); };
    resume();
    element.addEventListener("pause", resume);
    return () => element.removeEventListener("pause", resume);
  }, []);

  return (
    <section className="guide-hero">
      <video ref={video} poster={poster.url} autoPlay muted loop playsInline preload="none" className="guide-video" aria-hidden="true">
        <source src={compatibleVideo.url} type="video/webm" />
        <source src={videoAsset.url} type="video/mp4" />
      </video>
      <div className="guide-fade" aria-hidden="true" />
      <div className="guide-vignette" aria-hidden="true" />
      <div className="guide-stars" aria-hidden="true">{Array.from({ length: 6 }, (_, i) => <i key={i} />)}</div>
      <nav className="guide-nav" aria-label="Основная навигация">
        <Link to="/" className="guide-brand"><Headphones className="h-7 w-7" /> Аудиогид</Link>
        <div className="guide-links">
          <Link to="/map"><Map className="h-4 w-4" /><span>Карта</span></Link>
          <Link to="/library"><Headphones className="h-4 w-4" /><span>Мои аудио</span></Link>
          <Button asChild variant="ghost" size="icon" className="guide-glass" title="Проверка сервисов"><Link to="/test" aria-label="Проверка сервисов"><Wrench /></Link></Button>
        </div>
      </nav>
      <div className="guide-intro">
        <div className="guide-ornament" aria-hidden="true"><span />✦<span /></div>
        <h1>Аудиогид</h1>
        <p>У каждого места есть история.<br />Отправляйтесь навстречу своей.</p>
        <Button className="guide-cta" onClick={() => document.getElementById("tour-form")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" })}>Создать экскурсию <ArrowRight /></Button>
      </div>
    </section>
  );
}