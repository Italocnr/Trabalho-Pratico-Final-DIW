// Função para definir link ativo na navbar
document.addEventListener('DOMContentLoaded', function() {
    // Obter o caminho atual
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop() || 'index.html';
    
    // Mapeamento de páginas para links da navbar
    const pageMap = {
        'index.html': 'index.html',
        'sobre.html': 'sobre.html',
        'iniciacao-cientifica.html': 'iniciacao-cientifica.html',
        'contato.html': 'contato.html',
        'detalhes.html': 'index.html',
        'detalhes-evento.html': 'index.html',
        'login.html': 'index.html',
        'admin-login.html': 'index.html'
    };
    
    // Encontrar o link ativo
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        
        // Verificar se o link corresponde à página atual
        if (href && (href === currentPage || 
            (currentPage === 'index.html' && href === 'index.html') ||
            (currentPage === 'sobre.html' && href === 'sobre.html') ||
            (currentPage === 'iniciacao-cientifica.html' && href === 'iniciacao-cientifica.html') ||
            (currentPage === 'contato.html' && href === 'contato.html'))) {
            link.classList.add('active');
        }
    });
    
    // Estilo para links ativos
    const style = document.createElement('style');
    style.textContent = `
        .navbar-nav .nav-link.active {
            color: #FFC300 !important;
            font-weight: 700 !important;
            border-bottom: 2px solid #FFC300;
            padding-bottom: 2px;
        }
    `;
    document.head.appendChild(style);
});

// URL base da API (JSON Server)
const API_URL = 'http://localhost:3000';

// Função para realizar busca
async function handleSearch(event) {
    event.preventDefault();
    
    const searchInput = document.getElementById('searchInput') || document.querySelector('input[name="q"]');
    const searchTerm = searchInput.value.trim().toLowerCase();
    
    if (!searchTerm) {
        alert('Por favor, digite algo para pesquisar.');
        return;
    }
    
    // Redirecionar para página de resultados de busca
    window.location.href = `busca.html?q=${encodeURIComponent(searchTerm)}`;
}

// Se a página atual for busca.html, executar a busca
if (window.location.pathname.includes('busca.html')) {
    document.addEventListener('DOMContentLoaded', async function() {
        const urlParams = new URLSearchParams(window.location.search);
        const searchTerm = urlParams.get('q');
        
        if (searchTerm) {
            await performSearch(searchTerm);
        }
    });
}

// Função para executar a busca e exibir resultados
async function performSearch(searchTerm) {
    const searchTermLower = searchTerm.toLowerCase();
    const resultsContainer = document.getElementById('search-results');
    
    if (!resultsContainer) return;
    
    resultsContainer.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Pesquisando...</span></div><p class="mt-3">Pesquisando...</p></div>';
    
    const results = {
        eventos: [],
        projetos: [],
        professores: []
    };
    
    try {
        // Buscar eventos na API
        try {
            const eventosResponse = await fetch(`${API_URL}/eventos?ativo=true`);
            if (eventosResponse.ok) {
                const eventos = await eventosResponse.json();
                const eventosArray = Array.isArray(eventos) ? eventos : [];
                
                results.eventos = eventosArray.filter(evento => {
                    const titulo = (evento.titulo || '').toLowerCase();
                    const introducao = (evento.introducao || '').toLowerCase();
                    const texto = (evento.secaoDetalhes1?.texto || '').toLowerCase();
                    
                    return titulo.includes(searchTermLower) || 
                           introducao.includes(searchTermLower) || 
                           texto.includes(searchTermLower);
                });
            }
        } catch (error) {
            console.error('Erro ao buscar eventos:', error);
        }
        
        // Buscar projetos estáticos (definidos no app.js)
        // Aguardar um pouco para garantir que projetosDetalhes esteja carregado
        if (typeof projetosDetalhes !== 'undefined' && projetosDetalhes) {
            Object.keys(projetosDetalhes).forEach(projetoId => {
                const projeto = projetosDetalhes[projetoId];
                if (!projeto) return;
                
                const titulo = (projeto.titulo || '').toLowerCase();
                const introducao = (projeto.introducao || '').toLowerCase();
                const texto = (projeto.secaoDetalhes1?.texto || '').toLowerCase();
                
                if (titulo.includes(searchTermLower) || 
                    introducao.includes(searchTermLower) || 
                    texto.includes(searchTermLower)) {
                    results.projetos.push({
                        id: projetoId,
                        ...projeto
                    });
                }
            });
        }
        
        // Buscar professores (dados fixos da página)
        const professoresData = [
            { nome: 'Pedro Algusto', disciplina: 'Português', descricao: 'Mestre em Literatura Brasileira' },
            { nome: 'Ana Costa', disciplina: 'Matemática', descricao: 'Especialista em Metodologias Ativas' },
            { nome: 'Carlos Mendes', disciplina: 'História', descricao: 'Doutor em História Antiga' },
            { nome: 'Lúcia Pereira', disciplina: 'Geografia', descricao: 'Pesquisadora em Geopolítica' },
            { nome: 'Marcelo Alves', disciplina: 'Sociologia', descricao: 'Especialista em Sociologia Urbana' },
            { nome: 'Renata Gomes', disciplina: 'Filosofia', descricao: 'Mestra em Ética e Desenvolvimento Humano' },
            { nome: 'Laura Ribeiro', disciplina: 'Biologia', descricao: 'Doutora em Botânica' },
            { nome: 'Ricardo Oliveira', disciplina: 'Física', descricao: 'Engenheiro Elétrico e professor de Física' },
            { nome: 'Sofia Dantas', disciplina: 'Inglês', descricao: 'Certificada Cambridge' }
        ];
        
        results.professores = professoresData.filter(prof => {
            return prof.nome.toLowerCase().includes(searchTermLower) ||
                   prof.disciplina.toLowerCase().includes(searchTermLower) ||
                   prof.descricao.toLowerCase().includes(searchTermLower);
        });
        
        // Exibir resultados
        displaySearchResults(searchTerm, results);
        
    } catch (error) {
        console.error('Erro na busca:', error);
        resultsContainer.innerHTML = '<div class="alert alert-danger">Erro ao realizar a busca. Por favor, tente novamente.</div>';
    }
}

// Função para exibir resultados da busca
function displaySearchResults(searchTerm, results) {
    const resultsContainer = document.getElementById('search-results');
    if (!resultsContainer) return;
    
    const totalResults = results.eventos.length + results.projetos.length + results.professores.length;
    
    if (totalResults === 0) {
        resultsContainer.innerHTML = `
            <div class="alert alert-info">
                <h5>Nenhum resultado encontrado</h5>
                <p>Não encontramos resultados para "<strong>${escapeHtml(searchTerm)}</strong>".</p>
                <p>Tente pesquisar por outros termos ou verifique a ortografia.</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="mb-4">
            <h3>Resultados da busca para: "<strong>${escapeHtml(searchTerm)}</strong>"</h3>
            <p class="text-muted">Encontrados ${totalResults} resultado(s)</p>
        </div>
    `;
    
    // Eventos
    if (results.eventos.length > 0) {
        html += `
            <div class="mb-5">
                <h4 class="text-primary-color mb-3">
                    <i class="fas fa-calendar-alt me-2"></i>Eventos (${results.eventos.length})
                </h4>
                <div class="row g-3">
        `;
        
        results.eventos.forEach(evento => {
            const imagem = evento.secaoDetalhes1?.imagem || evento.imagem || 'assets/img/calendario.png';
            html += `
                <div class="col-md-6">
                    <div class="card h-100 shadow-sm">
                        <div class="row g-0">
                            <div class="col-4">
                                <img src="${escapeHtml(imagem)}" class="img-fluid rounded-start" alt="${escapeHtml(evento.titulo)}" style="height: 100%; object-fit: cover;">
                            </div>
                            <div class="col-8">
                                <div class="card-body">
                                    <h5 class="card-title">${escapeHtml(evento.titulo)}</h5>
                                    <p class="card-text small">${escapeHtml((evento.introducao || '').substring(0, 100))}...</p>
                                    <a href="detalhes-evento.html?id=${evento.id}" class="btn btn-sm btn-primary">Ver detalhes</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    }
    
    // Projetos
    if (results.projetos.length > 0) {
        html += `
            <div class="mb-5">
                <h4 class="text-primary-color mb-3">
                    <i class="fas fa-project-diagram me-2"></i>Projetos (${results.projetos.length})
                </h4>
                <div class="row g-3">
        `;
        
        results.projetos.forEach(projeto => {
            const imagem = projeto.secaoDetalhes1?.imagem || 'assets/img/feira_de_ciencias.png';
            html += `
                <div class="col-md-6">
                    <div class="card h-100 shadow-sm">
                        <div class="row g-0">
                            <div class="col-4">
                                <img src="${escapeHtml(imagem)}" class="img-fluid rounded-start" alt="${escapeHtml(projeto.titulo)}" style="height: 100%; object-fit: cover;">
                            </div>
                            <div class="col-8">
                                <div class="card-body">
                                    <h5 class="card-title">${escapeHtml(projeto.titulo)}</h5>
                                    <p class="card-text small">${escapeHtml((projeto.introducao || '').substring(0, 100))}...</p>
                                    <a href="detalhes.html?id=${projeto.id}" class="btn btn-sm btn-primary">Ver detalhes</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    }
    
    // Professores
    if (results.professores.length > 0) {
        html += `
            <div class="mb-5">
                <h4 class="text-primary-color mb-3">
                    <i class="fas fa-chalkboard-teacher me-2"></i>Professores (${results.professores.length})
                </h4>
                <div class="list-group">
        `;
        
        results.professores.forEach(prof => {
            html += `
                <div class="list-group-item">
                    <h5 class="mb-1">${escapeHtml(prof.nome)}</h5>
                    <p class="mb-1"><strong>${escapeHtml(prof.disciplina)}</strong></p>
                    <p class="mb-0 small text-muted">${escapeHtml(prof.descricao)}</p>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    }
    
    resultsContainer.innerHTML = html;
}

// Função auxiliar para escapar HTML
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

