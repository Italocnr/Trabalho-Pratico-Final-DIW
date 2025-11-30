// URL base da API - Usar window.API_URL diretamente
if (typeof window.API_URL === 'undefined') {
    window.API_URL = 'http://localhost:3000';
}
// Usar window.API_URL diretamente - não criar variável local para evitar conflito
// Todas as referências devem usar window.API_URL

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
    console.log('=== INICIALIZAÇÃO DO PAINEL DO ALUNO ===');
    console.log('API_URL:', window.API_URL);
    console.log('Verificando localStorage...');
    console.log('tipoUsuario:', localStorage.getItem('tipoUsuario'));
    console.log('usuarioId:', localStorage.getItem('usuarioId'));
    console.log('usuarioData:', localStorage.getItem('usuarioData'));
    
    // Verificar se API_URL está definida
    if (!window.API_URL) {
        console.error('❌ API_URL não está definida!');
        alert('Erro: API_URL não está definida. Verifique se o servidor está rodando.');
        return;
    }
    
    // Testar conexão com a API
    fetch(`${window.API_URL}/alunos`)
        .then(response => {
            console.log('✅ Conexão com API OK:', response.status);
            if (!response.ok) {
                console.warn('⚠ API retornou status:', response.status);
            }
        })
        .catch(error => {
            console.error('❌ Erro ao conectar com API:', error);
            alert('Erro ao conectar com o servidor. Verifique se o servidor JSON está rodando (npm start)');
        });
    
    // Verificar autenticação
    if (typeof redirecionarSeNaoAutenticado === 'function') {
        console.log('Função redirecionarSeNaoAutenticado encontrada');
        redirecionarSeNaoAutenticado('aluno');
    } else {
        console.log('Função redirecionarSeNaoAutenticado não encontrada, carregando script...');
        // Carregar script de autenticação se não estiver disponível
        const script = document.createElement('script');
        script.src = '../../assets/scripts/auth.js';
        script.onload = function() {
            console.log('Script auth.js carregado');
            redirecionarSeNaoAutenticado('aluno');
            setTimeout(() => {
                carregarDadosAluno();
                configurarEventos();
            }, 100);
        };
        document.head.appendChild(script);
        return;
    }
    
    console.log('Chamando carregarDadosAluno()...');
    setTimeout(() => {
        carregarDadosAluno();
        configurarEventos();
    }, 100);
    
    // Listener para quando os dados do current user forem atualizados
    window.addEventListener('currentUserUpdated', async function(event) {
        const { usuario, tipoUsuario } = event.detail;
        if (tipoUsuario === 'aluno' && usuario && usuario.id === alunoAtual?.id) {
            console.log('Dados do aluno atualizados via evento');
            const turmaMudou = usuario.turmaId !== alunoAtual?.turmaId;
            alunoAtual = usuario;
            
            // Recarregar turma se mudou
            if (turmaMudou && alunoAtual.turmaId) {
                try {
                            const responseTurma = await fetch(`${window.API_URL}/turmas/${alunoAtual.turmaId}`);
                    if (responseTurma.ok) {
                        turmaAluno = await responseTurma.json();
                    }
                } catch (e) {
                    console.warn('Erro ao carregar turma:', e);
                }
            }
            
            exibirDadosAluno();
        }
    });
    
    // Iniciar atualização automática de current user
    if (typeof iniciarAtualizacaoCurrentUser === 'function') {
        // Criar função customizada para atualizar também a interface
        const atualizarCurrentUserComInterface = async () => {
            if (typeof obterCurrentUser === 'function') {
                const currentUser = await obterCurrentUser();
                if (currentUser && currentUser.id === alunoAtual?.id) {
                    // Atualizar apenas se os dados mudaram
                    const dadosMudaram = JSON.stringify(currentUser) !== JSON.stringify(alunoAtual);
                    const turmaMudou = currentUser.turmaId !== alunoAtual?.turmaId;
                    
                    if (dadosMudaram || turmaMudou) {
                        alunoAtual = currentUser;
                        
                        // Recarregar turma se mudou
                        if (turmaMudou && alunoAtual.turmaId) {
                            try {
                                const responseTurma = await fetch(`${window.API_URL}/turmas/${alunoAtual.turmaId}`);
                                if (responseTurma.ok) {
                                    turmaAluno = await responseTurma.json();
                                }
                            } catch (e) {
                                console.warn('Erro ao carregar turma:', e);
                            }
                        }
                        
                        exibirDadosAluno();
                    }
                }
            }
        };
        
        // Atualizar imediatamente
        atualizarCurrentUserComInterface();
        
        // Atualizar periodicamente
        intervalIdCurrentUser = setInterval(() => {
            atualizarCurrentUserComInterface();
        }, 30000); // Atualizar a cada 30 segundos
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
async function carregarDadosAluno(usarCurrentUser = true) {
    console.log('=== CARREGANDO DADOS DO ALUNO ===');
    console.log('usarCurrentUser:', usarCurrentUser);
    
    try {
        // Primeiro, tentar usar dados do localStorage (mais rápido)
        const usuarioDataStr = localStorage.getItem('usuarioData');
        if (usuarioDataStr) {
            try {
                const usuarioData = JSON.parse(usuarioDataStr);
                console.log('Dados encontrados no localStorage:', usuarioData);
                if (usuarioData && usuarioData.id) {
                    alunoAtual = usuarioData;
                    console.log('Usando dados do localStorage temporariamente:', alunoAtual);
                    
                    // Carregar turma se tiver turmaId (antes de exibir)
                    if (alunoAtual.turmaId) {
                        try {
                            console.log('Carregando turma ID:', alunoAtual.turmaId);
                            const responseTurma = await fetch(`${window.API_URL}/turmas/${alunoAtual.turmaId}`);
                            if (responseTurma.ok) {
                                turmaAluno = await responseTurma.json();
                                console.log('Turma carregada:', turmaAluno);
                            } else {
                                console.warn('Erro ao buscar turma:', responseTurma.status);
                            }
                        } catch (e) {
                            console.warn('Erro ao carregar turma:', e);
                        }
                    }
                    
                    // Exibir dados imediatamente (com turma já carregada)
                    exibirDadosAluno();
                    
                    // Forçar exibição novamente após um pequeno delay
                    setTimeout(() => exibirDadosAluno(), 200);
                    setTimeout(() => exibirDadosAluno(), 500);
                    
                    // Carregar notas e calendário
                    carregarNotas();
                    carregarCalendario();
                }
            } catch (e) {
                console.error('Erro ao parsear dados do localStorage:', e);
            }
        }
        
        // Tentar usar current user para atualizar dados
        if (usarCurrentUser && typeof obterCurrentUser === 'function') {
            console.log('Tentando obter current user...');
            const currentUser = await obterCurrentUser();
            if (currentUser && currentUser.id) {
                alunoAtual = currentUser;
                console.log('Dados do aluno carregados via currentUser:', alunoAtual);
                
                // Carregar turma do aluno
                if (alunoAtual.turmaId) {
                    try {
                        const responseTurma = await fetch(`${window.API_URL}/turmas/${alunoAtual.turmaId}`);
                        if (responseTurma.ok) {
                            turmaAluno = await responseTurma.json();
                            console.log('Turma do aluno carregada:', turmaAluno);
                        } else {
                            console.warn('Erro ao buscar turma:', responseTurma.status, responseTurma.statusText);
                        }
                    } catch (e) {
                        console.warn('Erro ao carregar turma:', e);
                    }
                } else {
                    console.warn('Aluno não possui turmaId');
                }
                
                exibirDadosAluno();
                carregarNotas();
                carregarCalendario();
                return;
            }
        }
        
        // Se não conseguiu pelo current user, buscar diretamente
        const alunoId = obterUsuarioId();
        if (!alunoId) {
            throw new Error('ID do aluno não encontrado');
        }
        
        console.log('Buscando aluno diretamente com ID:', alunoId);
        console.log('URL da requisição:', `${window.API_URL}/alunos/${alunoId}`);
        
        const responseAluno = await fetch(`${window.API_URL}/alunos/${alunoId}`);
        console.log('Resposta da API:', responseAluno.status, responseAluno.statusText);
        
        if (!responseAluno.ok) {
            const errorText = await responseAluno.text();
            console.error('Erro na resposta:', errorText);
            throw new Error(`Erro ao carregar dados do aluno: ${responseAluno.status} ${responseAluno.statusText}`);
        }
        
        alunoAtual = await responseAluno.json();
        console.log('Dados do aluno carregados diretamente:', alunoAtual);
        
        if (!alunoAtual || !alunoAtual.id) {
            throw new Error('Dados do aluno inválidos');
        }
        
        // Atualizar localStorage com dados atualizados
        localStorage.setItem('usuarioData', JSON.stringify(alunoAtual));
        
        // Carregar turma do aluno
        if (alunoAtual.turmaId) {
            try {
                            const responseTurma = await fetch(`${window.API_URL}/turmas/${alunoAtual.turmaId}`);
                if (responseTurma.ok) {
                    turmaAluno = await responseTurma.json();
                    console.log('Turma do aluno carregada:', turmaAluno);
                } else {
                    console.warn('Erro ao buscar turma:', responseTurma.status, responseTurma.statusText);
                }
            } catch (e) {
                console.warn('Erro ao carregar turma:', e);
            }
        } else {
            console.warn('Aluno não possui turmaId');
        }
        
        exibirDadosAluno();
        carregarNotas();
        carregarCalendario();
    } catch (error) {
        console.error('Erro ao carregar dados do aluno:', error);
        
        // Tentar usar dados do localStorage como fallback
        const usuarioData = localStorage.getItem('usuarioData');
        if (usuarioData) {
            try {
                alunoAtual = JSON.parse(usuarioData);
                if (alunoAtual && alunoAtual.id) {
                    console.log('Usando dados do localStorage como fallback:', alunoAtual);
                    // Tentar carregar turma
                    if (alunoAtual.turmaId) {
                        try {
                            const responseTurma = await fetch(`${window.API_URL}/turmas/${alunoAtual.turmaId}`);
                            if (responseTurma.ok) {
                                turmaAluno = await responseTurma.json();
                            }
                        } catch (e) {
                            console.warn('Erro ao carregar turma:', e);
                        }
                    }
                    exibirDadosAluno();
                    carregarNotas();
                    carregarCalendario();
                    return;
                }
            } catch (e) {
                console.error('Erro ao parsear dados do localStorage:', e);
            }
        }
        
        // Último fallback: redirecionar para login
        console.error('Não foi possível carregar dados do aluno. Redirecionando para login...');
        if (typeof redirecionarSeNaoAutenticado === 'function') {
            redirecionarSeNaoAutenticado('aluno');
        } else {
            window.location.href = '../../login.html';
        }
    }
}

// Exibir dados do aluno
function exibirDadosAluno() {
    console.log('=== EXIBINDO DADOS DO ALUNO ===');
    
    if (!alunoAtual) {
        console.warn('Dados do aluno não disponíveis (alunoAtual é null/undefined)');
        return;
    }
    
    console.log('Dados do aluno para exibir:', alunoAtual);
    console.log('Turma do aluno:', turmaAluno);
    
    // Função auxiliar para tentar atualizar os elementos
    const atualizarElementos = () => {
        // Garantir que os elementos existam antes de atualizar
        const nomeEl = document.getElementById('aluno-nome');
        const matriculaEl = document.getElementById('aluno-matricula');
        const turmaEl = document.getElementById('aluno-turma');
        const anoLetivoEl = document.getElementById('aluno-ano-letivo');
        const nascimentoEl = document.getElementById('aluno-nascimento');
        
        console.log('Elementos HTML encontrados:', {
            nomeEl: !!nomeEl,
            matriculaEl: !!matriculaEl,
            turmaEl: !!turmaEl,
            anoLetivoEl: !!anoLetivoEl,
            nascimentoEl: !!nascimentoEl
        });
        
        if (!nomeEl || !matriculaEl || !turmaEl || !anoLetivoEl || !nascimentoEl) {
            console.warn('Alguns elementos HTML não foram encontrados, tentando novamente...');
            return false;
        }
        
        // Atualizar nome
        const nome = alunoAtual.nome || 'Não informado';
        nomeEl.textContent = nome;
        console.log('✓ Nome do aluno definido:', nome);
        
        // Atualizar matrícula
        const matricula = alunoAtual.matricula || '-';
        matriculaEl.textContent = matricula;
        console.log('✓ Matrícula do aluno definida:', matricula);
        
        // Atualizar turma e ano letivo
        if (turmaAluno) {
            const turmaNome = turmaAluno.nome || '-';
            turmaEl.textContent = turmaNome;
            console.log('✓ Turma do aluno definida:', turmaNome);
            
            const anoLetivo = turmaAluno.anoLetivo || '-';
            anoLetivoEl.textContent = anoLetivo;
            console.log('✓ Ano letivo definido:', anoLetivo);
        } else {
            turmaEl.textContent = '-';
            anoLetivoEl.textContent = '-';
            console.warn('⚠ Turma não carregada para o aluno');
        }
        
        // Atualizar data de nascimento
        if (alunoAtual.dataNascimento) {
            try {
                const data = new Date(alunoAtual.dataNascimento);
                if (!isNaN(data.getTime())) {
                    const dataFormatada = data.toLocaleDateString('pt-BR');
                    nascimentoEl.textContent = dataFormatada;
                    console.log('✓ Data de nascimento formatada:', dataFormatada);
                } else {
                    nascimentoEl.textContent = alunoAtual.dataNascimento;
                    console.log('✓ Data de nascimento (formato original):', alunoAtual.dataNascimento);
                }
            } catch (e) {
                console.warn('Erro ao formatar data de nascimento:', e);
                nascimentoEl.textContent = alunoAtual.dataNascimento || '-';
            }
        } else {
            nascimentoEl.textContent = '-';
            console.warn('⚠ Data de nascimento não disponível');
        }
        
        console.log('=== DADOS DO ALUNO EXIBIDOS COM SUCESSO ===');
        console.log('Resumo:', {
            nome: alunoAtual.nome,
            matricula: alunoAtual.matricula,
            turma: turmaAluno?.nome,
            anoLetivo: turmaAluno?.anoLetivo,
            dataNascimento: alunoAtual.dataNascimento
        });
        
        return true;
    };
    
    // Tentar atualizar imediatamente
    if (!atualizarElementos()) {
        // Se não conseguiu, tentar novamente após um pequeno delay
        setTimeout(() => {
            if (!atualizarElementos()) {
                // Última tentativa após mais tempo
                setTimeout(() => atualizarElementos(), 500);
            }
        }, 100);
    }
}

// Carregar notas do aluno
async function carregarNotas(mostrarLoading = true) {
    console.log('=== CARREGANDO NOTAS DO ALUNO ===');
    console.log('Aluno ID:', alunoAtual?.id);
    
    try {
        if (!alunoAtual || !alunoAtual.id) {
            console.warn('Aluno não está definido, não é possível carregar notas');
            return;
        }
        
        const loadingEl = document.getElementById('notas-loading');
        const vazioEl = document.getElementById('notas-vazio');
        const containerEl = document.getElementById('notas-container');
        
        if (!loadingEl || !vazioEl || !containerEl) {
            console.error('Elementos de notas não encontrados!');
            return;
        }
        
        if (mostrarLoading) {
            loadingEl.style.display = 'block';
            vazioEl.style.display = 'none';
            containerEl.style.display = 'none';
        }
        
        const url = `${window.API_URL}/notas?alunoId=${alunoAtual.id}`;
        console.log('Buscando notas na URL:', url);
        
        const response = await fetch(url);
        console.log('Resposta da API (notas):', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`Erro ao carregar notas: ${response.status} ${response.statusText}`);
        }
        
        const novasNotas = await response.json();
        console.log('Notas recebidas:', novasNotas);
        
        // Verificar se é um array
        if (!Array.isArray(novasNotas)) {
            console.warn('Resposta não é um array, convertendo...');
            todasNotas = novasNotas ? [novasNotas] : [];
        } else {
            todasNotas = novasNotas;
        }
        
        ultimaAtualizacaoNotas = new Date().toISOString();
        
        // Sempre esconder loading
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }
        
        if (todasNotas.length === 0) {
            console.log('Nenhuma nota encontrada');
            if (vazioEl) vazioEl.style.display = 'block';
            if (containerEl) containerEl.style.display = 'none';
        } else {
            console.log('Total de notas:', todasNotas.length);
            // Extrair disciplinas únicas
            disciplinas = [...new Set(todasNotas.map(n => n.disciplina))];
            popularSelectDisciplinas();
            calcularEstatisticas();
            exibirNotas();
            atualizarGraficos();
            
            if (vazioEl) vazioEl.style.display = 'none';
            if (containerEl) containerEl.style.display = 'block';
        }
    } catch (error) {
        console.error('❌ Erro ao carregar notas:', error);
        const loadingEl = document.getElementById('notas-loading');
        const vazioEl = document.getElementById('notas-vazio');
        const containerEl = document.getElementById('notas-container');
        
        if (loadingEl) loadingEl.style.display = 'none';
        if (vazioEl) vazioEl.style.display = 'block';
        if (containerEl) containerEl.style.display = 'none';
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
    
    fetch(`${window.API_URL}/eventos?ativo=true`)
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

