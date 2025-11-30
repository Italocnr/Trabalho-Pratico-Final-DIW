// URL base da API - Usar window.API_URL diretamente
if (typeof window.API_URL === 'undefined') {
    window.API_URL = 'http://localhost:3000';
}
// Usar window.API_URL diretamente - não criar variável local para evitar conflito
// Todas as referências devem usar window.API_URL

// Estado global
let professorAtual = null;
let turmasProfessor = [];
let alunosTurma = [];
let notasTurma = [];
let intervalIdCurrentUser = null;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== INICIALIZAÇÃO DO PAINEL DO PROFESSOR ===');
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
    fetch(`${window.API_URL}/professores`)
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
        redirecionarSeNaoAutenticado('professor');
    } else {
        console.log('Função redirecionarSeNaoAutenticado não encontrada, carregando script...');
        // Carregar script de autenticação se não estiver disponível
        const script = document.createElement('script');
        script.src = '../../assets/scripts/auth.js';
        script.onload = function() {
            console.log('Script auth.js carregado');
            redirecionarSeNaoAutenticado('professor');
            setTimeout(() => {
                carregarDadosProfessor();
                configurarEventos();
            }, 100);
        };
        document.head.appendChild(script);
        return;
    }
    
    console.log('Chamando carregarDadosProfessor()...');
    setTimeout(() => {
        carregarDadosProfessor();
        configurarEventos();
    }, 100);
    
    // Listener para quando os dados do current user forem atualizados
    window.addEventListener('currentUserUpdated', function(event) {
        const { usuario, tipoUsuario } = event.detail;
        if (tipoUsuario === 'professor' && usuario && usuario.id === professorAtual?.id) {
            console.log('Dados do professor atualizados via evento');
            professorAtual = usuario;
            exibirDadosProfessor();
        }
    });
    
    // Iniciar atualização automática de current user
    if (typeof iniciarAtualizacaoCurrentUser === 'function') {
        // Criar função customizada para atualizar também a interface
        const atualizarCurrentUserComInterface = async () => {
            if (typeof obterCurrentUser === 'function') {
                const currentUser = await obterCurrentUser();
                if (currentUser && currentUser.id === professorAtual?.id) {
                    // Atualizar apenas se os dados mudaram
                    if (JSON.stringify(currentUser) !== JSON.stringify(professorAtual)) {
                        professorAtual = currentUser;
                        exibirDadosProfessor();
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
    
    // Limpar intervalos ao sair da página
    window.addEventListener('beforeunload', function() {
        if (intervalIdCurrentUser && typeof pararAtualizacaoCurrentUser === 'function') {
            pararAtualizacaoCurrentUser(intervalIdCurrentUser);
        }
    });
});

// Carregar dados do professor
async function carregarDadosProfessor(usarCurrentUser = true) {
    console.log('=== CARREGANDO DADOS DO PROFESSOR ===');
    console.log('usarCurrentUser:', usarCurrentUser);
    
    try {
        // Primeiro, tentar usar dados do localStorage (mais rápido)
        const usuarioDataStr = localStorage.getItem('usuarioData');
        if (usuarioDataStr) {
            try {
                const usuarioData = JSON.parse(usuarioDataStr);
                console.log('Dados encontrados no localStorage:', usuarioData);
                if (usuarioData && usuarioData.id) {
                    professorAtual = usuarioData;
                    console.log('Usando dados do localStorage temporariamente:', professorAtual);
                    
                    // Exibir dados imediatamente
                    exibirDadosProfessor();
                    
                    // Forçar exibição novamente após um pequeno delay
                    setTimeout(() => exibirDadosProfessor(), 200);
                    setTimeout(() => exibirDadosProfessor(), 500);
                    
                    // Carregar turmas imediatamente
                    carregarTurmas();
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
                professorAtual = currentUser;
                console.log('Dados do professor carregados via currentUser:', professorAtual);
                exibirDadosProfessor();
                carregarTurmas();
                return;
            }
        }
        
        // Se não conseguiu pelo current user, buscar diretamente
        const professorId = obterUsuarioId();
        if (!professorId) {
            throw new Error('ID do professor não encontrado');
        }
        
        console.log('Buscando professor diretamente com ID:', professorId);
        console.log('URL da requisição:', `${window.API_URL}/professores/${professorId}`);
        
        const response = await fetch(`${window.API_URL}/professores/${professorId}`);
        console.log('Resposta da API:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Erro na resposta:', errorText);
            throw new Error(`Erro ao carregar dados do professor: ${response.status} ${response.statusText}`);
        }
        
        professorAtual = await response.json();
        console.log('Dados do professor carregados diretamente:', professorAtual);
        
        if (!professorAtual || !professorAtual.id) {
            throw new Error('Dados do professor inválidos');
        }
        
        // Atualizar localStorage com dados atualizados
        localStorage.setItem('usuarioData', JSON.stringify(professorAtual));
        
        exibirDadosProfessor();
        carregarTurmas();
    } catch (error) {
        console.error('Erro ao carregar dados do professor:', error);
        
        // Tentar usar dados do localStorage como fallback
        const usuarioData = localStorage.getItem('usuarioData');
        if (usuarioData) {
            try {
                professorAtual = JSON.parse(usuarioData);
                if (professorAtual && professorAtual.id) {
                    console.log('Usando dados do localStorage como fallback:', professorAtual);
                    exibirDadosProfessor();
                    carregarTurmas();
                    return;
                }
            } catch (e) {
                console.error('Erro ao parsear dados do localStorage:', e);
            }
        }
        
        // Último fallback: redirecionar para login
        console.error('Não foi possível carregar dados do professor. Redirecionando para login...');
        if (typeof redirecionarSeNaoAutenticado === 'function') {
            redirecionarSeNaoAutenticado('professor');
        } else {
            window.location.href = '../../login.html';
        }
    }
}

// Exibir dados do professor
function exibirDadosProfessor() {
    console.log('=== EXIBINDO DADOS DO PROFESSOR ===');
    
    if (!professorAtual) {
        console.warn('Dados do professor não disponíveis (professorAtual é null/undefined)');
        return;
    }
    
    console.log('Dados do professor para exibir:', professorAtual);
    
    // Função auxiliar para tentar atualizar os elementos
    const atualizarElementos = () => {
        // Garantir que os elementos existam antes de atualizar
        const nomeEl = document.getElementById('professor-nome');
        const disciplinaEl = document.getElementById('professor-disciplina');
        const formacaoEl = document.getElementById('professor-formacao');
        const emailEl = document.getElementById('professor-email');
        
        console.log('Elementos HTML encontrados:', {
            nomeEl: !!nomeEl,
            disciplinaEl: !!disciplinaEl,
            formacaoEl: !!formacaoEl,
            emailEl: !!emailEl
        });
        
        if (!nomeEl || !disciplinaEl || !formacaoEl || !emailEl) {
            console.warn('Alguns elementos HTML não foram encontrados, tentando novamente...');
            return false;
        }
        
        // Atualizar nome
        const nome = professorAtual.nome || 'Não informado';
        nomeEl.textContent = nome;
        console.log('✓ Nome do professor definido:', nome);
        
        // Atualizar disciplina
        const disciplina = professorAtual.disciplina || '-';
        disciplinaEl.textContent = disciplina;
        console.log('✓ Disciplina do professor definida:', disciplina);
        
        // Atualizar formação
        const formacao = professorAtual.formacao || '-';
        formacaoEl.textContent = formacao;
        console.log('✓ Formação do professor definida:', formacao);
        
        // Atualizar email
        const email = professorAtual.email || '-';
        emailEl.textContent = email;
        console.log('✓ Email do professor definido:', email);
        
        console.log('=== DADOS DO PROFESSOR EXIBIDOS COM SUCESSO ===');
        console.log('Resumo:', {
            nome: professorAtual.nome,
            disciplina: professorAtual.disciplina,
            formacao: professorAtual.formacao,
            email: professorAtual.email
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

// Carregar turmas do professor
async function carregarTurmas() {
    console.log('=== CARREGANDO TURMAS DO PROFESSOR ===');
    
    try {
        if (!professorAtual || !professorAtual.id) {
            console.error('Professor não está definido ou não possui ID');
            console.error('professorAtual:', professorAtual);
            return;
        }
        
        console.log('Professor ID:', professorAtual.id);
        console.log('Professor nome:', professorAtual.nome);
        
        const loadingEl = document.getElementById('turmas-loading');
        const vazioEl = document.getElementById('turmas-vazio');
        const listEl = document.getElementById('turmas-list');
        
        if (!loadingEl || !vazioEl || !listEl) {
            console.error('Elementos HTML não encontrados para exibir turmas');
            console.error('Tentando novamente em 500ms...');
            setTimeout(() => carregarTurmas(), 500);
            return;
        }
        
        loadingEl.style.display = 'block';
        vazioEl.style.display = 'none';
        
        const url = `${window.API_URL}/turmas?professorId=${professorAtual.id}`;
        console.log('Buscando turmas na URL:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Erro ao carregar turmas: ${response.status} ${response.statusText}`);
        }
        
        turmasProfessor = await response.json();
        console.log('Resposta da API:', turmasProfessor);
        
        // Verificar se é um array
        if (!Array.isArray(turmasProfessor)) {
            console.warn('Resposta não é um array, convertendo...');
            turmasProfessor = turmasProfessor ? [turmasProfessor] : [];
        }
        
        console.log('Turmas carregadas (array):', turmasProfessor);
        console.log('Total de turmas:', turmasProfessor.length);
        
        loadingEl.style.display = 'none';
        
        if (turmasProfessor.length === 0) {
            console.warn('⚠ Nenhuma turma encontrada para o professor');
            vazioEl.style.display = 'block';
            const totalTurmasEl = document.getElementById('total-turmas');
            if (totalTurmasEl) {
                totalTurmasEl.textContent = '0';
            }
        } else {
            console.log('✓ Turmas encontradas:', turmasProfessor.length);
            const totalTurmasEl = document.getElementById('total-turmas');
            if (totalTurmasEl) {
                totalTurmasEl.textContent = turmasProfessor.length;
                console.log('✓ Total de turmas atualizado:', turmasProfessor.length);
            }
            exibirTurmas();
            popularSelectsTurmas();
        }
    } catch (error) {
        console.error('❌ Erro ao carregar turmas:', error);
        const loadingEl = document.getElementById('turmas-loading');
        const vazioEl = document.getElementById('turmas-vazio');
        if (loadingEl) loadingEl.style.display = 'none';
        if (vazioEl) vazioEl.style.display = 'block';
    }
}

// Exibir turmas em cards
function exibirTurmas() {
    console.log('=== EXIBINDO TURMAS ===');
    console.log('Total de turmas para exibir:', turmasProfessor.length);
    
    const listEl = document.getElementById('turmas-list');
    if (!listEl) {
        console.error('Elemento turmas-list não encontrado!');
        return;
    }
    
    listEl.innerHTML = '';
    
    turmasProfessor.forEach((turma, index) => {
        console.log(`Criando card para turma ${index + 1}:`, turma);
        const card = criarCardTurma(turma);
        listEl.appendChild(card);
    });
    
    console.log('✓ Turmas exibidas com sucesso');
}

// Criar card de turma
function criarCardTurma(turma) {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4 mb-4';
    
    col.innerHTML = `
        <div class="card turma-card">
            <div class="card-header">
                <i class="fas fa-users me-2"></i>${turma.nome}
            </div>
            <div class="card-body">
                <p class="mb-2"><strong>Série:</strong> ${turma.serie}º Ano</p>
                <p class="mb-2"><strong>Turno:</strong> ${turma.turno}</p>
                <p class="mb-0"><strong>Ano Letivo:</strong> ${turma.anoLetivo}</p>
            </div>
        </div>
    `;
    
    return col;
}

// Popular selects de turmas
function popularSelectsTurmas() {
    console.log('=== POPULANDO SELECTS DE TURMAS ===');
    console.log('Total de turmas:', turmasProfessor.length);
    
    const selectNota = document.getElementById('select-turma-nota');
    const selectConsulta = document.getElementById('select-turma-consulta');
    
    if (!selectNota || !selectConsulta) {
        console.error('Selects de turmas não encontrados!');
        return;
    }
    
    [selectNota, selectConsulta].forEach((select, index) => {
        const tipo = index === 0 ? 'nota' : 'consulta';
        console.log(`Populando select de ${tipo}...`);
        
        select.innerHTML = '<option value="">Selecione uma turma</option>';
        turmasProfessor.forEach(turma => {
            const option = document.createElement('option');
            option.value = turma.id;
            option.textContent = turma.nome;
            select.appendChild(option);
            console.log(`  - Adicionada opção: ${turma.nome} (ID: ${turma.id})`);
        });
    });
    
    console.log('✓ Selects de turmas populados com sucesso');
}

// Configurar eventos
function configurarEventos() {
    // Botão carregar alunos para lançar notas
    document.getElementById('btn-carregar-alunos').addEventListener('click', function() {
        const turmaId = document.getElementById('select-turma-nota').value;
        const bimestre = document.getElementById('select-bimestre').value;
        
        if (!turmaId) {
            alert('Por favor, selecione uma turma');
            return;
        }
        
        carregarAlunosParaNotas(turmaId, bimestre);
    });
    
    // Select de turma para consulta
    document.getElementById('select-turma-consulta').addEventListener('change', function() {
        const turmaId = this.value;
        const bimestre = document.getElementById('select-bimestre-consulta').value;
        
        if (turmaId) {
            carregarNotasConsulta(turmaId, bimestre);
        } else {
            document.getElementById('notas-consulta-container').style.display = 'none';
            document.getElementById('notas-vazio').style.display = 'block';
        }
    });
    
    // Select de bimestre para consulta
    document.getElementById('select-bimestre-consulta').addEventListener('change', function() {
        const turmaId = document.getElementById('select-turma-consulta').value;
        const bimestre = this.value;
        
        if (turmaId) {
            carregarNotasConsulta(turmaId, bimestre);
        }
    });
    
    // Form de notas
    document.getElementById('form-notas').addEventListener('submit', function(e) {
        e.preventDefault();
        salvarNotas();
    });
}

// Carregar alunos para lançar notas
async function carregarAlunosParaNotas(turmaId, bimestre) {
    console.log('=== CARREGANDO ALUNOS PARA LANÇAR NOTAS ===');
    console.log('Turma ID:', turmaId);
    console.log('Bimestre:', bimestre);
    
    try {
        if (!turmaId) {
            alert('Por favor, selecione uma turma');
            return;
        }
        
        const url = `${window.API_URL}/alunos?turmaId=${turmaId}`;
        console.log('Buscando alunos na URL:', url);
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Erro ao carregar alunos: ${response.status} ${response.statusText}`);
        }
        
        alunosTurma = await response.json();
        console.log('Alunos carregados:', alunosTurma);
        
        // Verificar se é um array
        if (!Array.isArray(alunosTurma)) {
            console.warn('Resposta não é um array, convertendo...');
            alunosTurma = alunosTurma ? [alunosTurma] : [];
        }
        
        console.log('Total de alunos:', alunosTurma.length);
        
        // Carregar notas existentes para esta turma e bimestre
        await carregarNotasParaTurma(turmaId, bimestre);
        
        const tbody = document.getElementById('tbody-notas');
        if (!tbody) {
            console.error('Elemento tbody-notas não encontrado!');
            return;
        }
        
        tbody.innerHTML = '';
        
        if (alunosTurma.length === 0) {
            console.warn('Nenhum aluno encontrado para esta turma');
            alert('Nenhum aluno encontrado para esta turma.');
            return;
        }
        
        alunosTurma.forEach((aluno, index) => {
            console.log(`Criando linha para aluno ${index + 1}:`, aluno.nome);
            const row = criarLinhaNota(aluno, turmaId, bimestre);
            tbody.appendChild(row);
        });
        
        const container = document.getElementById('alunos-notas-container');
        if (container) {
            container.style.display = 'block';
            console.log('✓ Tabela de alunos exibida');
        }
    } catch (error) {
        console.error('❌ Erro ao carregar alunos:', error);
        alert('Erro ao carregar alunos. Tente novamente.');
    }
}

// Criar linha de nota
function criarLinhaNota(aluno, turmaId, bimestre) {
    console.log(`Criando linha de nota para aluno: ${aluno.nome} (ID: ${aluno.id})`);
    
    const tr = document.createElement('tr');
    
    // Buscar nota existente
    const notaExistente = notasTurma.find(n => 
        n.alunoId === aluno.id && n.turmaId === turmaId && n.bimestre === bimestre
    );
    
    if (notaExistente) {
        console.log('Nota existente encontrada:', notaExistente);
    } else {
        console.log('Nenhuma nota existente encontrada para este aluno');
    }
    
    const nota1 = notaExistente ? notaExistente.nota1 : '';
    const nota2 = notaExistente ? notaExistente.nota2 : '';
    const nota3 = notaExistente ? notaExistente.nota3 : '';
    const media = notaExistente ? notaExistente.media : 0;
    
    tr.innerHTML = `
        <td>${aluno.matricula || '-'}</td>
        <td>${aluno.nome || '-'}</td>
        <td>
            <input type="number" class="form-control input-nota" 
                   name="nota1_${aluno.id}" value="${nota1}" 
                   min="0" max="10" step="0.1" required>
        </td>
        <td>
            <input type="number" class="form-control input-nota" 
                   name="nota2_${aluno.id}" value="${nota2}" 
                   min="0" max="10" step="0.1" required>
        </td>
        <td>
            <input type="number" class="form-control input-nota" 
                   name="nota3_${aluno.id}" value="${nota3}" 
                   min="0" max="10" step="0.1" required>
        </td>
        <td class="media-cell" id="media_${aluno.id}">${media.toFixed(2)}</td>
    `;
    
    // Adicionar event listeners para calcular média
    const inputs = tr.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            calcularMedia(tr, aluno.id);
        });
    });
    
    // Adicionar data attributes
    tr.dataset.alunoId = aluno.id;
    tr.dataset.turmaId = turmaId;
    tr.dataset.bimestre = bimestre;
    if (notaExistente) {
        tr.dataset.notaId = notaExistente.id;
    }
    
    return tr;
}

// Calcular média
function calcularMedia(tr, alunoId) {
    const inputs = tr.querySelectorAll('input[type="number"]');
    let soma = 0;
    let count = 0;
    
    inputs.forEach(input => {
        const valor = parseFloat(input.value);
        if (!isNaN(valor) && valor >= 0) {
            soma += valor;
            count++;
        }
    });
    
    const media = count > 0 ? soma / count : 0;
    const mediaCell = document.getElementById(`media_${alunoId}`);
    mediaCell.textContent = media.toFixed(2);
    
    // Adicionar classe de cor baseada na média
    mediaCell.className = 'media-cell';
    if (media >= 7) {
        mediaCell.classList.add('media-aprovado');
    } else if (media >= 5) {
        mediaCell.classList.add('media-recuperacao');
    } else {
        mediaCell.classList.add('media-reprovado');
    }
}

// Salvar notas
async function salvarNotas() {
    const tbody = document.getElementById('tbody-notas');
    const linhas = tbody.querySelectorAll('tr');
    const turmaId = document.getElementById('select-turma-nota').value;
    const bimestre = document.getElementById('select-bimestre').value;
    
    const notasParaSalvar = [];
    
    linhas.forEach(tr => {
        const alunoId = tr.dataset.alunoId;
        const notaId = tr.dataset.notaId;
        
        const nota1 = parseFloat(tr.querySelector(`input[name="nota1_${alunoId}"]`).value);
        const nota2 = parseFloat(tr.querySelector(`input[name="nota2_${alunoId}"]`).value);
        const nota3 = parseFloat(tr.querySelector(`input[name="nota3_${alunoId}"]`).value);
        
        const media = (nota1 + nota2 + nota3) / 3;
        
        const nota = {
            alunoId: alunoId,
            turmaId: turmaId,
            disciplina: professorAtual.disciplina,
            bimestre: bimestre,
            nota1: nota1,
            nota2: nota2,
            nota3: nota3,
            media: media,
            dataLancamento: new Date().toISOString().split('T')[0]
        };
        
        if (notaId) {
            nota.id = notaId;
        }
        
        notasParaSalvar.push(nota);
    });
    
    try {
        const alunosNotificados = new Set();
        
        for (const nota of notasParaSalvar) {
            if (nota.id) {
                // Atualizar nota existente
                await fetch(`${window.API_URL}/notas/${nota.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(nota)
                });
            } else {
                // Criar nova nota
                await fetch(`${window.API_URL}/notas`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(nota)
                });
            }
            
            // Adicionar aluno à lista de notificados
            alunosNotificados.add(nota.alunoId);
        }
        
        // Notificar todos os alunos que tiveram notas atualizadas
        alunosNotificados.forEach(alunoId => {
            notificarAlunoNotasAtualizadas(alunoId);
        });
        
        alert('Notas salvas com sucesso!');
        // Recarregar notas para atualizar os IDs
        await carregarNotasParaTurma(turmaId, bimestre);
        carregarAlunosParaNotas(turmaId, bimestre);
    } catch (error) {
        console.error('Erro ao salvar notas:', error);
        alert('Erro ao salvar notas. Tente novamente.');
    }
}

// Notificar aluno sobre atualização de notas
function notificarAlunoNotasAtualizadas(alunoId) {
    try {
        // Usar localStorage para notificar (funciona entre abas)
        const notificacao = {
            alunoId: alunoId,
            timestamp: new Date().toISOString(),
            professorId: professorAtual.id,
            disciplina: professorAtual.disciplina
        };
        
        localStorage.setItem('notasAtualizadas', JSON.stringify(notificacao));
        
        // Remover após um tempo para evitar acúmulo
        setTimeout(() => {
            localStorage.removeItem('notasAtualizadas');
        }, 1000);
        
        // Disparar evento customizado para a mesma aba
        window.dispatchEvent(new CustomEvent('notasAtualizadas', { detail: notificacao }));
    } catch (error) {
        console.error('Erro ao notificar aluno:', error);
    }
}

// Carregar notas para turma (para consulta)
async function carregarNotasParaTurma(turmaId, bimestre) {
    console.log('=== CARREGANDO NOTAS PARA TURMA ===');
    console.log('Turma ID:', turmaId);
    console.log('Bimestre:', bimestre);
    
    try {
        let url = `${window.API_URL}/notas?turmaId=${turmaId}`;
        if (bimestre) {
            url += `&bimestre=${bimestre}`;
        }
        
        console.log('Buscando notas na URL:', url);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Erro ao carregar notas: ${response.status} ${response.statusText}`);
        }
        
        notasTurma = await response.json();
        
        // Verificar se é um array
        if (!Array.isArray(notasTurma)) {
            console.warn('Resposta não é um array, convertendo...');
            notasTurma = notasTurma ? [notasTurma] : [];
        }
        
        console.log('Notas carregadas:', notasTurma);
        console.log('Total de notas:', notasTurma.length);
    } catch (error) {
        console.error('❌ Erro ao carregar notas:', error);
        notasTurma = [];
    }
}

// Carregar notas para consulta
async function carregarNotasConsulta(turmaId, bimestre) {
    try {
        await carregarNotasParaTurma(turmaId, bimestre);
        
        if (notasTurma.length === 0) {
            document.getElementById('notas-consulta-container').style.display = 'none';
            document.getElementById('notas-vazio').style.display = 'block';
            return;
        }
        
        // Carregar alunos da turma
        const response = await fetch(`${window.API_URL}/alunos?turmaId=${turmaId}`);
        if (!response.ok) throw new Error('Erro ao carregar alunos');
        
        const alunos = await response.json();
        exibirNotasConsulta(notasTurma, alunos);
        
        document.getElementById('notas-consulta-container').style.display = 'block';
        document.getElementById('notas-vazio').style.display = 'none';
    } catch (error) {
        console.error('Erro ao carregar notas para consulta:', error);
        document.getElementById('notas-consulta-container').style.display = 'none';
        document.getElementById('notas-vazio').style.display = 'block';
    }
}

// Exibir notas para consulta
function exibirNotasConsulta(notas, alunos) {
    const tbody = document.getElementById('tbody-consulta');
    tbody.innerHTML = '';
    
    notas.forEach(nota => {
        const aluno = alunos.find(a => a.id === nota.alunoId);
        if (!aluno) return;
        
        const tr = document.createElement('tr');
        const situacao = getSituacao(nota.media);
        const situacaoClass = getSituacaoClass(nota.media);
        
        tr.innerHTML = `
            <td>${aluno.matricula}</td>
            <td>${aluno.nome}</td>
            <td>${nota.bimestre}º Bimestre</td>
            <td>${nota.nota1.toFixed(1)}</td>
            <td>${nota.nota2.toFixed(1)}</td>
            <td>${nota.nota3.toFixed(1)}</td>
            <td class="media-cell ${situacaoClass}">${nota.media.toFixed(2)}</td>
            <td><span class="badge ${situacaoClass.replace('media-', 'badge-')}">${situacao}</span></td>
        `;
        
        tbody.appendChild(tr);
    });
}

// Obter situação do aluno
function getSituacao(media) {
    if (media >= 7) return 'Aprovado';
    if (media >= 5) return 'Recuperação';
    return 'Reprovado';
}

// Obter classe CSS da situação
function getSituacaoClass(media) {
    if (media >= 7) return 'media-aprovado';
    if (media >= 5) return 'media-recuperacao';
    return 'media-reprovado';
}


