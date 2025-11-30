// URL base da API
const API_URL = 'http://localhost:3000';

// Estado global
let alunoAtual = null;
let turmaAluno = null;
let todasNotas = [];
let disciplinas = [];
let graficos = {};
let intervalIdCurrentUser = null;
let intervalIdNotas = null;
let ultimaAtualizacaoNotas = null;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticação
    if (typeof redirecionarSeNaoAutenticado === 'function') {
        redirecionarSeNaoAutenticado('aluno');
    } else {
        // Carregar script de autenticação se não estiver disponível
        const script = document.createElement('script');
        script.src = '../../assets/scripts/auth.js';
        script.onload = function() {
            redirecionarSeNaoAutenticado('aluno');
            carregarDadosAluno();
            configurarEventos();
        };
        document.head.appendChild(script);
        return;
    }
    
    carregarDadosAluno();
    configurarEventos();
    
    // Iniciar atualização automática de current user
    if (typeof iniciarAtualizacaoCurrentUser === 'function') {
        intervalIdCurrentUser = iniciarAtualizacaoCurrentUser(30000); // Atualizar a cada 30 segundos
    }
    
    // Iniciar polling de notas para atualização em tempo real
    iniciarPollingNotas();
    
    // Limpar intervalos ao sair da página
    window.addEventListener('beforeunload', function() {
        if (intervalIdCurrentUser && typeof pararAtualizacaoCurrentUser === 'function') {
            pararAtualizacaoCurrentUser(intervalIdCurrentUser);
        }
        if (intervalIdNotas) {
            clearInterval(intervalIdNotas);
        }
    });
});

// Carregar dados do aluno
async function carregarDadosAluno() {
    try {
        // Tentar usar current user primeiro
        if (typeof obterCurrentUser === 'function') {
            const currentUser = await obterCurrentUser();
            if (currentUser) {
                alunoAtual = currentUser;
            }
        }
        
        // Se não conseguiu pelo current user, buscar diretamente
        if (!alunoAtual) {
            const alunoId = obterUsuarioId() || '1';
            const responseAluno = await fetch(`${API_URL}/alunos/${alunoId}`);
            if (!responseAluno.ok) throw new Error('Erro ao carregar dados do aluno');
            alunoAtual = await responseAluno.json();
        }
        
        // Carregar turma do aluno
        if (alunoAtual.turmaId) {
            const responseTurma = await fetch(`${API_URL}/turmas/${alunoAtual.turmaId}`);
            if (responseTurma.ok) {
                turmaAluno = await responseTurma.json();
            }
        }
        
        exibirDadosAluno();
        carregarNotas();
        carregarCalendario();
    } catch (error) {
        console.error('Erro:', error);
        // Fallback para dados simulados
        alunoAtual = {
            id: "1",
            nome: "João Silva",
            matricula: "AL001",
            turmaId: "1",
            dataNascimento: "2010-05-15",
            responsavel: "Ana Silva",
            telefone: "(31) 99876-5432"
        };
        turmaAluno = {
            id: "1",
            nome: "1º Ano A",
            serie: "1",
            turno: "Manhã",
            anoLetivo: "2025"
        };
        exibirDadosAluno();
        carregarNotas();
        carregarCalendario();
    }
}

// Exibir dados do aluno
function exibirDadosAluno() {
    if (!alunoAtual) return;
    
    document.getElementById('aluno-nome').textContent = alunoAtual.nome;
    document.getElementById('aluno-matricula').textContent = alunoAtual.matricula;
    
    if (turmaAluno) {
        document.getElementById('aluno-turma').textContent = turmaAluno.nome;
        document.getElementById('aluno-ano-letivo').textContent = turmaAluno.anoLetivo;
    }
    
    if (alunoAtual.dataNascimento) {
        const data = new Date(alunoAtual.dataNascimento);
        const dataFormatada = data.toLocaleDateString('pt-BR');
        document.getElementById('aluno-nascimento').textContent = dataFormatada;
    }
}

// Carregar notas do aluno
async function carregarNotas(mostrarLoading = true) {
    try {
        const loadingEl = document.getElementById('notas-loading');
        const vazioEl = document.getElementById('notas-vazio');
        const containerEl = document.getElementById('notas-container');
        
        if (mostrarLoading) {
            loadingEl.style.display = 'block';
            vazioEl.style.display = 'none';
            containerEl.style.display = 'none';
        }
        
        const response = await fetch(`${API_URL}/notas?alunoId=${alunoAtual.id}`);
        if (!response.ok) throw new Error('Erro ao carregar notas');
        
        const novasNotas = await response.json();
        
        // Verificar se há novas notas
        const haNovasNotas = JSON.stringify(novasNotas) !== JSON.stringify(todasNotas);
        
        todasNotas = novasNotas;
        ultimaAtualizacaoNotas = new Date().toISOString();
        
        if (mostrarLoading) {
            loadingEl.style.display = 'none';
        }
        
        if (todasNotas.length === 0) {
            vazioEl.style.display = 'block';
        } else {
            // Extrair disciplinas únicas
            disciplinas = [...new Set(todasNotas.map(n => n.disciplina))];
            popularSelectDisciplinas();
            calcularEstatisticas();
            exibirNotas();
            atualizarGraficos();
            
            // Mostrar notificação se houver novas notas
            if (haNovasNotas && !mostrarLoading) {
                mostrarNotificacaoNotas();
            }
        }
    } catch (error) {
        console.error('Erro ao carregar notas:', error);
        if (mostrarLoading) {
            document.getElementById('notas-loading').style.display = 'none';
            document.getElementById('notas-vazio').style.display = 'block';
        }
    }
}

// Iniciar polling de notas para atualização em tempo real
function iniciarPollingNotas(intervalo = 5000) { // Verificar a cada 5 segundos
    // Verificar quando há mudanças no localStorage (notificação do professor em outra aba)
    window.addEventListener('storage', function(e) {
        if (e.key === 'notasAtualizadas' && e.newValue) {
            const dados = JSON.parse(e.newValue);
            if (dados.alunoId === alunoAtual.id) {
                carregarNotas(false); // Recarregar sem mostrar loading
            }
        }
    });
    
    // Escutar evento customizado (para mesma aba)
    window.addEventListener('notasAtualizadas', function(e) {
        const dados = e.detail;
        if (dados && dados.alunoId === alunoAtual.id) {
            carregarNotas(false); // Recarregar sem mostrar loading
        }
    });
    
    // Verificar localStorage periodicamente (para mesma aba)
    let ultimaNotificacao = null;
    const verificarNotificacao = () => {
        try {
            const notificacaoStr = localStorage.getItem('notasAtualizadas');
            if (notificacaoStr) {
                const dados = JSON.parse(notificacaoStr);
                if (dados.alunoId === alunoAtual.id && dados.timestamp !== ultimaNotificacao) {
                    ultimaNotificacao = dados.timestamp;
                    carregarNotas(false); // Recarregar sem mostrar loading
                }
            }
        } catch (error) {
            console.error('Erro ao verificar notificação:', error);
        }
    };
    
    // Polling periódico de notas e verificação de notificações
    intervalIdNotas = setInterval(() => {
        verificarNotificacao();
        carregarNotas(false); // Recarregar sem mostrar loading
    }, intervalo);
}

// Mostrar notificação de novas notas
function mostrarNotificacaoNotas() {
    // Criar notificação visual
    const notificacao = document.createElement('div');
    notificacao.className = 'alert alert-success alert-dismissible fade show position-fixed';
    notificacao.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notificacao.innerHTML = `
        <i class="fas fa-check-circle me-2"></i>
        <strong>Novas notas disponíveis!</strong> Suas notas foram atualizadas.
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notificacao);
    
    // Remover após 5 segundos
    setTimeout(() => {
        if (notificacao.parentNode) {
            notificacao.remove();
        }
    }, 5000);
}

// Popular select de disciplinas
function popularSelectDisciplinas() {
    const select = document.getElementById('select-disciplina-notas');
    select.innerHTML = '<option value="">Todas as disciplinas</option>';
    
    disciplinas.forEach(disciplina => {
        const option = document.createElement('option');
        option.value = disciplina;
        option.textContent = disciplina;
        select.appendChild(option);
    });
}

// Exibir notas
function exibirNotas() {
    const tbody = document.getElementById('tbody-notas');
    tbody.innerHTML = '';
    
    const bimestreFiltro = document.getElementById('select-bimestre-notas').value;
    const disciplinaFiltro = document.getElementById('select-disciplina-notas').value;
    
    let notasFiltradas = todasNotas;
    
    if (bimestreFiltro) {
        notasFiltradas = notasFiltradas.filter(n => n.bimestre === bimestreFiltro);
    }
    
    if (disciplinaFiltro) {
        notasFiltradas = notasFiltradas.filter(n => n.disciplina === disciplinaFiltro);
    }
    
    if (notasFiltradas.length === 0) {
        document.getElementById('notas-container').style.display = 'none';
        document.getElementById('notas-vazio').style.display = 'block';
        return;
    }
    
    document.getElementById('notas-container').style.display = 'block';
    document.getElementById('notas-vazio').style.display = 'none';
    
    // Agrupar por disciplina
    const notasPorDisciplina = {};
    notasFiltradas.forEach(nota => {
        if (!notasPorDisciplina[nota.disciplina]) {
            notasPorDisciplina[nota.disciplina] = [];
        }
        notasPorDisciplina[nota.disciplina].push(nota);
    });
    
    Object.keys(notasPorDisciplina).forEach(disciplina => {
        notasPorDisciplina[disciplina].forEach(nota => {
            const tr = document.createElement('tr');
            const situacao = getSituacao(nota.media);
            const situacaoClass = getSituacaoClass(nota.media);
            
            tr.innerHTML = `
                <td><strong>${nota.disciplina}</strong></td>
                <td>${nota.bimestre}º Bimestre</td>
                <td>${nota.nota1.toFixed(1)}</td>
                <td>${nota.nota2.toFixed(1)}</td>
                <td>${nota.nota3.toFixed(1)}</td>
                <td class="media-cell ${situacaoClass}"><strong>${nota.media.toFixed(2)}</strong></td>
                <td><span class="badge ${situacaoClass.replace('media-', 'badge-')}">${situacao}</span></td>
            `;
            
            tbody.appendChild(tr);
        });
    });
}

// Calcular estatísticas
function calcularEstatisticas() {
    // Calcular média geral
    if (todasNotas.length === 0) {
        document.getElementById('media-geral').textContent = '0.0';
        document.getElementById('situacao-geral').textContent = '-';
        return;
    }
    
    // Calcular média por disciplina e depois média geral
    const mediasPorDisciplina = {};
    todasNotas.forEach(nota => {
        if (!mediasPorDisciplina[nota.disciplina]) {
            mediasPorDisciplina[nota.disciplina] = [];
        }
        mediasPorDisciplina[nota.disciplina].push(nota.media);
    });
    
    const mediasFinais = Object.keys(mediasPorDisciplina).map(disciplina => {
        const medias = mediasPorDisciplina[disciplina];
        return medias.reduce((a, b) => a + b, 0) / medias.length;
    });
    
    const mediaGeral = mediasFinais.reduce((a, b) => a + b, 0) / mediasFinais.length;
    
    document.getElementById('media-geral').textContent = mediaGeral.toFixed(2);
    
    const situacao = getSituacao(mediaGeral);
    const situacaoClass = getSituacaoClass(mediaGeral);
    const situacaoEl = document.getElementById('situacao-geral');
    situacaoEl.textContent = situacao;
    situacaoEl.className = `stat-badge ${situacaoClass}`;
    
    // Contar disciplinas por situação
    let aprovadas = 0;
    let recuperacao = 0;
    let reprovadas = 0;
    
    mediasFinais.forEach(media => {
        if (media >= 7) aprovadas++;
        else if (media >= 5) recuperacao++;
        else reprovadas++;
    });
    
    document.getElementById('disciplinas-aprovadas').textContent = aprovadas;
    document.getElementById('disciplinas-recuperacao').textContent = recuperacao;
    document.getElementById('disciplinas-reprovadas').textContent = reprovadas;
    document.getElementById('total-disciplinas').textContent = mediasFinais.length;
}

// Obter situação do aluno
function getSituacao(media) {
    if (media >= 7) return 'Aprovado';
    if (media >= 5) return 'Recuperação';
    return 'Reprovado';
}

// Obter classe CSS da situação
function getSituacaoClass(media) {
    if (media >= 7) return 'aprovado';
    if (media >= 5) return 'recuperacao';
    return 'reprovado';
}

// Configurar eventos
function configurarEventos() {
    // Filtros de notas
    document.getElementById('select-bimestre-notas').addEventListener('change', exibirNotas);
    document.getElementById('select-disciplina-notas').addEventListener('change', exibirNotas);
    
    // Event listener para mudança de aba (para atualizar gráficos)
    const tabs = document.querySelectorAll('[data-bs-toggle="tab"]');
    tabs.forEach(tab => {
        tab.addEventListener('shown.bs.tab', function(event) {
            if (event.target.id === 'desempenho-tab') {
                setTimeout(() => {
                    atualizarGraficos();
                }, 100);
            }
        });
    });
}

// Atualizar gráficos
function atualizarGraficos() {
    criarGraficoMediasDisciplinas();
    criarGraficoEvolucao();
    criarRankingDisciplinas();
    atualizarHistorico();
}

// Criar gráfico de médias por disciplina
function criarGraficoMediasDisciplinas() {
    const ctx = document.getElementById('mediasDisciplinasChart');
    if (!ctx) return;
    
    // Calcular média por disciplina
    const mediasPorDisciplina = {};
    todasNotas.forEach(nota => {
        if (!mediasPorDisciplina[nota.disciplina]) {
            mediasPorDisciplina[nota.disciplina] = [];
        }
        mediasPorDisciplina[nota.disciplina].push(nota.media);
    });
    
    const disciplinas = Object.keys(mediasPorDisciplina);
    const medias = disciplinas.map(disciplina => {
        const medias = mediasPorDisciplina[disciplina];
        return medias.reduce((a, b) => a + b, 0) / medias.length;
    });
    
    // Destruir gráfico anterior se existir
    if (graficos.mediasDisciplinas) {
        graficos.mediasDisciplinas.destroy();
    }
    
    graficos.mediasDisciplinas = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: disciplinas,
            datasets: [{
                label: 'Média',
                data: medias,
                backgroundColor: medias.map(media => {
                    if (media >= 7) return 'rgba(40, 167, 69, 0.8)';
                    if (media >= 5) return 'rgba(255, 193, 7, 0.8)';
                    return 'rgba(220, 53, 69, 0.8)';
                }),
                borderColor: medias.map(media => {
                    if (media >= 7) return 'rgba(40, 167, 69, 1)';
                    if (media >= 5) return 'rgba(255, 193, 7, 1)';
                    return 'rgba(220, 53, 69, 1)';
                }),
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 10,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Média: ' + context.parsed.y.toFixed(2);
                        }
                    }
                }
            }
        }
    });
}

// Criar gráfico de evolução
function criarGraficoEvolucao() {
    const ctx = document.getElementById('evolucaoNotasChart');
    if (!ctx) return;
    
    // Agrupar notas por bimestre
    const notasPorBimestre = {};
    todasNotas.forEach(nota => {
        if (!notasPorBimestre[nota.bimestre]) {
            notasPorBimestre[nota.bimestre] = [];
        }
        notasPorBimestre[nota.bimestre].push(nota.media);
    });
    
    const bimestres = Object.keys(notasPorBimestre).sort();
    const mediasBimestres = bimestres.map(bimestre => {
        const medias = notasPorBimestre[bimestre];
        return medias.reduce((a, b) => a + b, 0) / medias.length;
    });
    
    // Destruir gráfico anterior se existir
    if (graficos.evolucao) {
        graficos.evolucao.destroy();
    }
    
    graficos.evolucao = new Chart(ctx, {
        type: 'line',
        data: {
            labels: bimestres.map(b => `${b}º Bimestre`),
            datasets: [{
                label: 'Média Geral',
                data: mediasBimestres,
                borderColor: 'rgba(0, 51, 102, 1)',
                backgroundColor: 'rgba(0, 51, 102, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 6,
                pointBackgroundColor: 'rgba(0, 51, 102, 1)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 10,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Média: ' + context.parsed.y.toFixed(2);
                        }
                    }
                }
            }
        }
    });
}

// Criar ranking de disciplinas
function criarRankingDisciplinas() {
    const container = document.getElementById('ranking-disciplinas');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Calcular média por disciplina
    const mediasPorDisciplina = {};
    todasNotas.forEach(nota => {
        if (!mediasPorDisciplina[nota.disciplina]) {
            mediasPorDisciplina[nota.disciplina] = [];
        }
        mediasPorDisciplina[nota.disciplina].push(nota.media);
    });
    
    const disciplinasComMedias = Object.keys(mediasPorDisciplina).map(disciplina => {
        const medias = mediasPorDisciplina[disciplina];
        const media = medias.reduce((a, b) => a + b, 0) / medias.length;
        return { disciplina, media };
    });
    
    // Ordenar por média (maior para menor)
    disciplinasComMedias.sort((a, b) => b.media - a.media);
    
    disciplinasComMedias.forEach((item, index) => {
        const col = document.createElement('div');
        col.className = 'col-md-6 mb-3';
        
        const posicao = index + 1;
        let posicaoClass = 'outro';
        if (posicao === 1) posicaoClass = 'ouro';
        else if (posicao === 2) posicaoClass = 'prata';
        else if (posicao === 3) posicaoClass = 'bronze';
        
        const situacaoClass = getSituacaoClass(item.media);
        
        col.innerHTML = `
            <div class="ranking-item">
                <div class="ranking-posicao ${posicaoClass}">${posicao}º</div>
                <div class="ranking-info">
                    <div class="ranking-disciplina">${item.disciplina}</div>
                    <div class="ranking-media">Média: ${item.media.toFixed(2)}</div>
                </div>
                <div class="ranking-badge">
                    <span class="badge badge-${situacaoClass}">${getSituacao(item.media)}</span>
                </div>
            </div>
        `;
        
        container.appendChild(col);
    });
}

// Atualizar histórico
function atualizarHistorico() {
    const tbody = document.getElementById('tbody-historico');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Ordenar notas por disciplina e depois por bimestre
    const notasOrdenadas = [...todasNotas].sort((a, b) => {
        if (a.disciplina !== b.disciplina) {
            return a.disciplina.localeCompare(b.disciplina);
        }
        return a.bimestre.localeCompare(b.bimestre);
    });
    
    if (notasOrdenadas.length === 0) {
        document.getElementById('historico-vazio').style.display = 'block';
        return;
    }
    
    document.getElementById('historico-vazio').style.display = 'none';
    
    notasOrdenadas.forEach(nota => {
        const tr = document.createElement('tr');
        const situacao = getSituacao(nota.media);
        const situacaoClass = getSituacaoClass(nota.media);
        
        const data = nota.dataLancamento ? new Date(nota.dataLancamento).toLocaleDateString('pt-BR') : '-';
        
        tr.innerHTML = `
            <td><strong>${nota.disciplina}</strong></td>
            <td>${nota.bimestre}º Bimestre</td>
            <td>${nota.nota1.toFixed(1)}</td>
            <td>${nota.nota2.toFixed(1)}</td>
            <td>${nota.nota3.toFixed(1)}</td>
            <td class="media-cell ${situacaoClass}"><strong>${nota.media.toFixed(2)}</strong></td>
            <td><span class="badge badge-${situacaoClass}">${situacao}</span></td>
            <td>${data}</td>
        `;
        
        tbody.appendChild(tr);
    });
}

// Carregar calendário
function carregarCalendario() {
    const calendarEl = document.getElementById('calendario-aluno');
    if (!calendarEl) return;
    
    // Aguardar FullCalendar carregar
    if (typeof FullCalendar === 'undefined') {
        setTimeout(carregarCalendario, 100);
        return;
    }
    
    fetch(`${API_URL}/eventos?ativo=true`)
        .then(response => response.json())
        .then(eventos => {
            const eventosFormatados = eventos.map(evento => ({
                title: evento.titulo,
                start: evento.data,
                backgroundColor: getCorEvento(evento.tipo),
                borderColor: getCorEvento(evento.tipo),
                textColor: '#fff'
            }));
            
            const calendar = new FullCalendar.Calendar(calendarEl, {
                initialView: 'dayGridMonth',
                locale: 'pt-br',
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,listWeek'
                },
                events: eventosFormatados,
                eventClick: function(info) {
                    alert('Evento: ' + info.event.title + '\nData: ' + info.event.start.toLocaleDateString('pt-BR'));
                }
            });
            
            calendar.render();
        })
        .catch(error => {
            console.error('Erro ao carregar eventos:', error);
        });
}

// Obter cor do evento baseado no tipo
function getCorEvento(tipo) {
    const cores = {
        'evento-escolar': '#003366',
        'prova-geral': '#dc3545',
        'reuniao-pais': '#28a745',
        'feriado': '#ffc107',
        'atividade-extracurricular': '#17a2b8',
        'formacao': '#6f42c1',
        'outro': '#6c757d'
    };
    return cores[tipo] || '#6c757d';
}

