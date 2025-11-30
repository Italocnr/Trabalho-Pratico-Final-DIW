// URL base da API
const API_URL = 'http://localhost:3000';

// Função para verificar se um evento está nos favoritos do usuário logado
async function isFavorito(eventoId) {
    const usuarioId = localStorage.getItem('usuarioId');
    if (!usuarioId) return false;
    
    try {
        const response = await fetch(`${API_URL}/favoritos?usuarioId=${usuarioId}&eventoId=${eventoId}`);
        if (!response.ok) return false;
        
        const favoritos = await response.json();
        return Array.isArray(favoritos) && favoritos.length > 0;
    } catch (error) {
        console.error('Erro ao verificar favorito:', error);
        return false;
    }
}

// Função para marcar/desmarcar favorito
async function toggleFavorito(eventoId, eventoElemento = null) {
    const usuarioId = localStorage.getItem('usuarioId');
    const tipoUsuario = localStorage.getItem('tipoUsuario');
    
    // Verificar se usuário está logado
    if (!usuarioId || !tipoUsuario) {
        alert('Você precisa estar logado para marcar eventos como favoritos!');
        if (typeof redirecionarSeNaoAutenticado !== 'undefined') {
            window.location.href = 'login.html';
        }
        return false;
    }
    
    try {
        const jaFavorito = await isFavorito(eventoId);
        
        if (jaFavorito) {
            // Remover favorito
            const response = await fetch(`${API_URL}/favoritos?usuarioId=${usuarioId}&eventoId=${eventoId}`);
            if (!response.ok) throw new Error('Erro ao buscar favorito');
            
            const favoritos = await response.json();
            if (Array.isArray(favoritos) && favoritos.length > 0) {
                const favoritoId = favoritos[0].id;
                const deleteResponse = await fetch(`${API_URL}/favoritos/${favoritoId}`, {
                    method: 'DELETE'
                });
                
                if (deleteResponse.ok) {
                    atualizarIconeFavorito(eventoId, eventoElemento, false);
                    return true;
                }
            }
        } else {
            // Adicionar favorito
            const novoFavorito = {
                usuarioId: usuarioId,
                eventoId: eventoId,
                dataAdicao: new Date().toISOString()
            };
            
            const response = await fetch(`${API_URL}/favoritos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(novoFavorito)
            });
            
            if (response.ok) {
                atualizarIconeFavorito(eventoId, eventoElemento, true);
                return true;
            }
        }
        
        return false;
    } catch (error) {
        console.error('Erro ao alternar favorito:', error);
        alert('Erro ao marcar evento como favorito. Tente novamente.');
        return false;
    }
}

// Função para atualizar o ícone de favorito
function atualizarIconeFavorito(eventoId, elemento = null, isFavorito) {
    let iconeElemento = elemento;
    
    // Se não foi passado elemento, tentar encontrar pelo eventoId
    if (!iconeElemento) {
        iconeElemento = document.querySelector(`[data-favorito-id="${eventoId}"]`);
    }
    
    if (iconeElemento) {
        if (isFavorito) {
            iconeElemento.classList.remove('far', 'fa-heart');
            iconeElemento.classList.add('fas', 'fa-heart', 'text-danger');
            iconeElemento.title = 'Remover dos favoritos';
        } else {
            iconeElemento.classList.remove('fas', 'fa-heart', 'text-danger');
            iconeElemento.classList.add('far', 'fa-heart');
            iconeElemento.title = 'Adicionar aos favoritos';
        }
    }
}

// Função para criar o HTML do botão de favorito
function criarBotaoFavorito(eventoId, isFavorito = false) {
    const classes = isFavorito 
        ? 'fas fa-heart text-danger' 
        : 'far fa-heart';
    
    const title = isFavorito 
        ? 'Remover dos favoritos' 
        : 'Adicionar aos favoritos';
    
    return `
        <button 
            class="btn btn-link p-0 favorito-btn" 
            data-favorito-id="${eventoId}"
            onclick="toggleFavorito('${eventoId}', this)"
            title="${title}"
            style="position: absolute; top: 10px; right: 10px; z-index: 10; background: rgba(255,255,255,0.8); border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border: none;">
            <i class="${classes} fa-2x"></i>
        </button>
    `;
}

// Função para inicializar ícones de favorito em elementos existentes
async function inicializarFavoritos() {
    const usuarioId = localStorage.getItem('usuarioId');
    if (!usuarioId) return;
    
    // Encontrar todos os botões de favorito
    const botoesFavorito = document.querySelectorAll('[data-favorito-id]');
    
    for (const botao of botoesFavorito) {
        const eventoId = botao.getAttribute('data-favorito-id');
        if (eventoId) {
            const jaFavorito = await isFavorito(eventoId);
            atualizarIconeFavorito(eventoId, botao, jaFavorito);
        }
    }
}

// Carregar favoritos quando a página carregar
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        // Aguardar um pouco para garantir que os cards foram criados
        setTimeout(inicializarFavoritos, 1000);
    });
}


