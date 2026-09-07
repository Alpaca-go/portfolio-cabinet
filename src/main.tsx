import React from 'react';
import ReactDOM from 'react-dom/client';
import { ArchiveScene } from './components/archive/ArchiveScene';
import './styles/global.css';

function App() {
  return <main className="archive-page">
    <header className="masthead"><a className="identity" href="/" aria-label="Wang Qi 设计档案馆首页"><span className="monogram">wq<span>®</span></span><span className="identity-caption">WANG QI<br/>INDEPENDENT DESIGNER</span></a><span className="edition">PORTFOLIO<br/>VOL. 001 / 2026</span></header>
    <section className="intro" aria-labelledby="archive-title"><p className="eyebrow"><span className="status-dot"/> A PERSONAL COLLECTION</p><h1 id="archive-title">Design, on file<span className="period">.</span></h1><p className="intro-note">关于品牌、物件与想象的设计档案。</p></section>
    <section className="cabinet-stage" aria-label="三维档案柜静态展示：三个分类抽屉及顶部工作证"><div className="stage-index" aria-hidden="true">FIG. 01 — THE ARCHIVE</div><ArchiveScene/><div className="stage-caption"><span className="caption-line"/><span>IDEAS, CAREFULLY FILED.</span><span className="caption-line"/></div></section>
    <footer className="archive-footer"><div className="collection-index" aria-label="档案分类"><span><b>01</b> BRAND</span><span><b>02</b> PACKAGING</span><span><b>03</b> IP / ILLUSTRATION</span></div><div className="colophon"><span>WANG QI © 2026</span><span>设计档案馆 <span className="tiny-cross">＋</span></span></div></footer>
  </main>;
}
ReactDOM.createRoot(document.getElementById('root')!).render(<App/>);
