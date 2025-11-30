// URL base da API
const API_URL = 'http://localhost:3000';

// Estado global
let professorAtual = null;
let turmasProfessor = [];
let alunosTurma = [];
let notasTurma = [];
let intervalIdCurrentUser = null;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticação
    if (typeof redirecionarSeNaoAutenticado === 'function') {
        redirecionarSeNaoAutenticado('professor');
    } else {
        // Carregar script de autenticação se não estiver disponível
        const script = document.createElement('script');
        script.src = '../../assets/scripts/auth.js';
        script.onload = function() {
            redirecionarSeNaoAutenticado('professor');
            carregarDadosProfessor();
            configurarEventos();
        };
        document.head.appendChild(script);
        return;
    }
    
    carregarDadosProfessor();
    configurarEventos();
    
    // Iniciar atualização automática de current user
    if (typeof iniciarAtualizacaoCurrentUser === 'function') {
        intervalIdCurrentUser = iniciarAtualizacaoCurrentUser(30000); // Atualizar a cada 30 segundos
    }
    
    // Limpar intervalos ao sair da página
    window.addEventListener('beforeunload', function() {
        if (intervalIdCurrentUser && typeof pararAtualizacaoCurrentUser === 'function') {
            pararAtualizacaoCurrentUser(intervalIdCurrentUser);
        }
    });
});

// Carregar dados do professor
async function carregarDadosProfessor() {
    try {
        // Tentar usar current user primeiro
        if (typeof obterCurrentUser === 'function') {
            const currentUser = await obterCurrentUser();
            if (currentUser) {
                professorAtual = currentUser;
            }
        }
        
        // Se não conseguiu pelo current user, buscar diretamente
        if (!professorAtual) {
            const professorId = obterUsuarioId() || '1';
            const response = await fetch(`${API_URL}/professores/${professorId}`);
            if (!response.ok) throw new Error('Erro ao carregar dados do professor');
            professorAtual = await response.json();
        }
        
        exibirDadosProfessor();
        carregarTurmas();
    } catch (error) {
        console.error('Erro:', error);
        // Fallback para dados simulados
        professorAtual = {
            id: "1",
            nome: "Ana Costa",
            email: "ana.costa@escola.edu.br",
            disciplina: "Matemática",
            formacao: "Mestre em Matemática Aplicada",
            telefone: "(31) 99999-1111",
            matricula: "PROF001"
        };
        exibirDadosProfessor();
        carregarTurmas();
    }
}

// Exibir dados do professor
function exibirDadosProfessor() {
    if (!professorAtual) return;
    
    document.getElementById('professor-nome').textContent = professorAtual.nome;
    document.getElementById('professor-disciplina').textContent = professorAtual.disciplina;
    document.getElementById('professor-formacao').textContent = professorAtual.formacao;
    document.getElementById('professor-email').textContent = professorAtual.email;
}

// Carregar turmas do professor
async function carregarTurmas() {
    try {
        const loadingEl = document.getElementById('turmas-loading');
        const vazioEl = document.getElementById('turmas-vazio');
        const listEl = document.getElementById('turmas-list');
        
        loadingEl.style.display = 'block';
        vazioEl.style.display = 'none';
        
        const response = await fetch(`${API_URL}/turmas?professorId=${professorAtual.id}`);
        if (!response.ok) throw new Error('Erro ao carregar turmas');
        
        turmasProfessor = await response.json();
        
        loadingEl.style.display = 'none';
        
        if (turmasProfessor.length === 0) {
            vazioEl.style.display = 'block';
            document.getElementById('total-turmas').textContent = '0';
        } else {
            document.getElementById('total-turmas').textContent = turmasProfessor.length;
            exibirTurmas();
            popularSelectsTurmas();
        }
    } catch (error) {
        console.error('Erro ao carregar turmas:', error);
        document.getElementById('turmas-loading').style.display = 'none';
        document.getElementById('turmas-vazio').style.display = 'block';
    }
}

// Exibir turmas em cards
function exibirTurmas() {
    const listEl = document.getElementById('turmas-list');
    listEl.innerHTML = '';
    
    turmasProfessor.forEach(turma => {
        const card = criarCardTurma(turma);
        listEl.appendChild(card);
    });
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
    const selectNota = document.getElementById('select-turma-nota');
    const selectConsulta = document.getElementById('select-turma-consulta');
    
    [selectNota, selectConsulta].forEach(select => {
        select.innerHTML = '<option value="">Selecione uma turma</option>';
        turmasProfessor.forEach(turma => {
            const option = document.createElement('option');
            option.value = turma.id;
            option.textContent = turma.nome;
            select.appendChild(option);
        });
    });
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
    try {
        const response = await fetch(`${API_URL}/alunos?turmaId=${turmaId}`);
        if (!response.ok) throw new Error('Erro ao carregar alunos');
        
        alunosTurma = await response.json();
        const tbody = document.getElementById('tbody-notas');
        tbody.innerHTML = '';
        
        alunosTurma.forEach(aluno => {
            const row = criarLinhaNota(aluno, turmaId, bimestre);
            tbody.appendChild(row);
        });
        
        document.getElementById('alunos-notas-container').style.display = 'block';
    } catch (error) {
        console.error('Erro ao carregar alunos:', error);
        alert('Erro ao carregar alunos. Tente novamente.');
    }
}

// Criar linha de nota
function criarLinhaNota(aluno, turmaId, bimestre) {
    const tr = document.createElement('tr');
    
    // Buscar nota existente
    const notaExistente = notasTurma.find(n => 
        n.alunoId === aluno.id && n.turmaId === turmaId && n.bimestre === bimestre
    );
    
    const nota1 = notaExistente ? notaExistente.nota1 : '';
    const nota2 = notaExistente ? notaExistente.nota2 : '';
    const nota3 = notaExistente ? notaExistente.nota3 : '';
    const media = notaExistente ? notaExistente.media : 0;
    
    tr.innerHTML = `
        <td>${aluno.matricula}</td>
        <td>${aluno.nome}</td>
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
                await fetch(`${API_URL}/notas/${nota.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(nota)
                });
            } else {
                // Criar nova nota
                await fetch(`${API_URL}/notas`, {
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
    try {
        let url = `${API_URL}/notas?turmaId=${turmaId}`;
        if (bimestre) {
            url += `&bimestre=${bimestre}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Erro ao carregar notas');
        
        notasTurma = await response.json();
    } catch (error) {
        console.error('Erro ao carregar notas:', error);
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
        const response = await fetch(`${API_URL}/alunos?turmaId=${turmaId}`);
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


