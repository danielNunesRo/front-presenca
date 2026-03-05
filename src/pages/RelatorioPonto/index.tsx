import { useEffect, useState } from "react";
import styles from "./styles.module.css";
import { api } from "../../services/api";

interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: string;
  ativo: boolean;
}

interface Ponto {
  dataHora: string;
  valido: boolean;
  motivo: string;
}

export default function Relatorio() {

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(null);
  const [pontos, setPontos] = useState<Ponto[]>([]);
  const [painelAberto, setPainelAberto] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    carregarUsuarios();
  }, []);

  async function carregarUsuarios() {
    try {

      const response = await api.get<Usuario[]>("/users", {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUsuarios(response.data);

    } catch (error) {
      console.error("Erro ao carregar usuários", error);
    }
  }

  async function selecionarUsuario(user: Usuario) {

    try {

      setUsuarioSelecionado(user);

      const response = await api.get<Ponto[]>(
        `/pontos/all?usuarioId=${user.id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const pontosOrdenados = response.data.sort(
        (a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime()
      );

      const ultimos10 = pontosOrdenados.slice(-10).reverse();

      setPontos(ultimos10);
      setPainelAberto(true);

    } catch (error) {
      console.error("Erro ao carregar pontos", error);
    }
  }

  function calcularEmoji() {

    if (pontos.length === 0) return "🙂";

    const atrasos: Record<string, boolean> = {};

    pontos.forEach((p) => {

      const data = new Date(p.dataHora);

      const dia =
        data.getFullYear() +
        "-" +
        (data.getMonth() + 1) +
        "-" +
        data.getDate();

      if (atrasos[dia] === undefined) {

        const hora = data.getHours();
        const minuto = data.getMinutes();

        if (hora > 7 || (hora === 7 && minuto > 30)) {
          atrasos[dia] = true;
        } else {
          atrasos[dia] = false;
        }
      }
    });

    const totalAtrasos = Object.values(atrasos).filter(v => v).length;

    if (totalAtrasos >= 3) return "😞";
    if (totalAtrasos >= 1) return "😐";

    return "😄";
  }

  async function baixarRelatorio() {

    if (!usuarioSelecionado) return;

    try {

      const response = await api.get(
        `/pontos/relatorio?usuarioId=${usuarioSelecionado.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob"
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));

      const link = document.createElement("a");

      link.href = url;
      link.download = `relatorio-${usuarioSelecionado.nome}.xlsx`;

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Erro ao baixar relatório", error);
    }
  }

  return (
    <div className={styles.container}>

      <div className={styles.listaUsuarios}>
        <h2>Funcionários</h2>

        {usuarios.map((u) => (
          <div
            key={u.id}
            className={styles.usuarioCard}
            onClick={() => selecionarUsuario(u)}
          >
            <div className={styles.usuarioNome}>{u.nome}</div>
            <div className={styles.usuarioEmail}>{u.email}</div>
          </div>
        ))}
      </div>

      <div className={`${styles.painel} ${painelAberto ? styles.aberto : ""}`}>

        {usuarioSelecionado && (
          <>
            <div className={styles.headerPainel}>
              <h2>{usuarioSelecionado.nome}</h2>
              <div className={styles.emoji}>{calcularEmoji()}</div>
            </div>

            <div className={styles.secao}>
              <h3>Últimos 10 pontos</h3>

              <div className={styles.listaPontos}>
                {pontos.map((p, i) => (
                  <div key={i} className={styles.pontoItem}>
                    <div>
                      {new Date(p.dataHora).toLocaleString("pt-BR")}
                    </div>

                    <div className={p.valido ? styles.valido : styles.invalido}>
                      {p.valido ? "Válido" : "Inválido"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              className={styles.botaoDownload}
              onClick={baixarRelatorio}
            >
              Baixar relatório Excel
            </button>
          </>
        )}

      </div>
    </div>
  );
}