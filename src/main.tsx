import ReactDOM from 'react-dom/client';
import { ArchiveScene } from './components/archive/ArchiveScene';
import './styles/global.css';

function App() {
  return <main className="cabinet-only" aria-label="三维档案柜"><ArchiveScene/></main>;
}
ReactDOM.createRoot(document.getElementById('root')!).render(<App/>);
