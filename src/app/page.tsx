import Link from "next/link";
import { PublicShell } from "@/components/layout/PublicShell";
import { Icon, type IconName } from "@/components/ui/Icon";

const FEATURES: { icon: IconName; title: string; text: string }[] = [
  { icon: "tarefas", title: "Tudo em um só lugar", text: "Tarefas, compromissos, hábitos e objetivos no mesmo cadastro, usado por todos os módulos." },
  { icon: "assistente", title: "Assistente que conhece você", text: "Pergunte “Como está minha programação de amanhã?” e receba respostas com os seus dados reais." },
  { icon: "planejamento", title: "Planejamento no seu tempo livre", text: "O NEXO encaixa as atividades nos seus horários disponíveis, respeita prioridades e aponta conflitos." },
  { icon: "confirmar", title: "Você decide", text: "Toda sugestão da IA chega como prévia. Nada muda na sua agenda sem a sua aprovação." },
  { icon: "lembretes", title: "Lembretes e avisos", text: "Avisos de atividades próximas, lembretes recorrentes e alertas de pendências." },
  { icon: "insights", title: "Insights da sua rotina", text: "Histórico de conclusões e adiamentos, padrões e resumo semanal com sugestões." },
];

export default function HomePage() {
  return (
    <PublicShell>
      <section className="hero" aria-labelledby="titulo-hero">
        <div className="hero__text">
          <span className="hero__kicker">Assistente pessoal inteligente</span>
          <h1 id="titulo-hero" className="hero__title">
            Sua rotina organizada, <span>com um assistente que planeja junto com você.</span>
          </h1>
          <p className="hero__lead">
            O NEXO transforma tarefas, compromissos e objetivos em um plano diário viável, conversa sobre a sua rotina e avisa antes
            que algo saia do controle.
          </p>
          <div className="actions">
            <Link href="/cadastro" className="btn btn--primary">
              Começar agora
            </Link>
            <Link href="/entrar" className="btn btn--secondary">
              Já tenho conta
            </Link>
          </div>
        </div>
        <figure className="hero__preview" style={{ margin: 0 }}>
          <div className="brief">
            <span className="brief__icon">
              <Icon name="assistente" size={20} />
            </span>
            <div className="brief__body">
              <p>Hoje você tem treino de peito às 18h30. Deseja consultar sua programação?</p>
            </div>
          </div>
          <div className="brief">
            <span className="brief__icon">
              <Icon name="assistente" size={20} />
            </span>
            <div className="brief__body">
              <p>Percebi que algumas atividades estão sendo adiadas com frequência. Posso sugerir uma nova organização para sua semana?</p>
            </div>
          </div>
          <figcaption className="muted xsmall">Exemplo ilustrativo do briefing do Painel: as mensagens reais são geradas a partir dos dados de cada usuário.</figcaption>
        </figure>
      </section>
      <section aria-labelledby="titulo-recursos" className="stack stack--lg">
        <h2 id="titulo-recursos">O que o NEXO faz</h2>
        <ul className="features" role="list">
          {FEATURES.map((f) => (
            <li key={f.title} className="feature">
              <span className="feature__icon">
                <Icon name={f.icon} />
              </span>
              <h3>{f.title}</h3>
              <p className="secondary small">{f.text}</p>
            </li>
          ))}
        </ul>
      </section>
    </PublicShell>
  );
}
