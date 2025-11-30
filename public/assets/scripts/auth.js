// URL base da API - Declarar globalmente
if (typeof window.API_URL === 'undefined') {
    window.API_URL = 'http://localhost:3000';
}
// Usar window.API_URL diretamente - não criar variável local

// Função para converter data de DD/MM/YYYY para YYYY-MM-DD
function converterDataParaFormatoJSON(dataString) {
    if (!dataString) return null;
    
    // Remove espaços e caracteres especiais
    dataString = dataString.trim();
    
    // Verifica se já está no formato YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dataString)) {
        return dataString;
    }
    
    // Tenta converter de DD/MM/YYYY para YYYY-MM-DD
    const partes = dataString.split(/[\/\-\.]/);
    
    if (partes.length === 3) {
        let dia, mes, ano;
        
        // Se o primeiro número tem 4 dígitos, está no formato YYYY-MM-DD ou YYYY/MM/DD
        if (partes[0].length === 4) {
            ano = partes[0];
            mes = partes[1].padStart(2, '0');
            dia = partes[2].padStart(2, '0');
        } else {
            // Formato DD/MM/YYYY ou DD-MM-YYYY
            dia = partes[0].padStart(2, '0');
            mes = partes[1].padStart(2, '0');
            ano = partes[2];
        }
        
        // Validar se a data é válida
        if (dia && mes && ano && dia.length === 2 && mes.length === 2 && ano.length === 4) {
            return `${ano}-${mes}-${dia}`;
        }
    }
    
    return null;
}

// Função para validar senha (pode ser data de nascimento ou senha customizada)
function validarSenha(senhaDigitada, dataNascimento, senhaSalva) {
    // Primeiro, tenta comparar diretamente com a senha salva
    if (senhaDigitada === senhaSalva) {
        return true;
    }
    
    // Se não, tenta converter a senha digitada como data e comparar com dataNascimento
    if (dataNascimento) {
        const dataConvertida = converterDataParaFormatoJSON(senhaDigitada);
        if (dataConvertida === dataNascimento) {
            return true;
        }
    }
    
    return false;
}

// Função para fazer login (apenas com matrícula e senha)
async function fazerLogin(tipoUsuario, matricula, senha) {
    try {
        if (tipoUsuario === 'aluno') {
            // Buscar por matrícula
            const response = await fetch(`${window.API_URL}/alunos?matricula=${matricula}`);
            const alunos = await response.json();
            
            if (alunos.length === 0) {
                console.log('Aluno não encontrado com matrícula:', matricula);
                return false;
            }
            
            const aluno = alunos[0];
            console.log('Aluno encontrado:', aluno);
            console.log('Data de nascimento no JSON:', aluno.dataNascimento);
            console.log('Senha digitada:', senha);
            console.log('Senha salva:', aluno.senha);
            
            // Validar senha (pode ser data de nascimento ou senha customizada)
            const senhaValida = validarSenha(senha, aluno.dataNascimento, aluno.senha);
            
            if (senhaValida) {
                // Verificar se a senha é a data de nascimento (primeiro login)
                const dataConvertida = converterDataParaFormatoJSON(senha);
                const precisaTrocarSenha = (aluno.dataNascimento && dataConvertida === aluno.dataNascimento) || 
                                         (aluno.senhaTrocada === false) ||
                                         (aluno.senha === aluno.dataNascimento);
                
                console.log('Senha válida! Precisa trocar senha:', precisaTrocarSenha);
                
                // Criar sessão
                const sessao = {
                    tipo: 'aluno',
                    usuarioId: aluno.id,
                    matricula: aluno.matricula,
                    dataLogin: new Date().toISOString(),
                    precisaTrocarSenha: precisaTrocarSenha
                };
                
                try {
                    const responseSessao = await fetch(`${window.API_URL}/sessoes`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(sessao)
                    });
                    
                    if (responseSessao.ok) {
                        const sessaoData = await responseSessao.json();
                        localStorage.setItem('sessaoAluno', JSON.stringify(sessaoData));
                    } else {
                        localStorage.setItem('sessaoAluno', JSON.stringify(sessao));
                    }
                } catch (error) {
                    console.warn('Erro ao criar sessão na API:', error);
                    localStorage.setItem('sessaoAluno', JSON.stringify(sessao));
                }
                
                localStorage.setItem('tipoUsuario', 'aluno');
                localStorage.setItem('usuarioId', aluno.id);
                localStorage.setItem('precisaTrocarSenha', precisaTrocarSenha ? 'true' : 'false');
                localStorage.setItem('usuarioData', JSON.stringify(aluno));
                
                console.log('=== DADOS SALVOS NO LOCALSTORAGE ===');
                console.log('tipoUsuario:', 'aluno');
                console.log('usuarioId:', aluno.id);
                console.log('usuarioData:', aluno);
                console.log('=== FIM DO LOGIN ===');
                
                return true;
            } else {
                console.log('Senha inválida');
                return false;
            }
        } else if (tipoUsuario === 'professor') {
            // Buscar por matrícula
            const response = await fetch(`${window.API_URL}/professores?matricula=${matricula}`);
            const professores = await response.json();
            
            if (professores.length === 0) {
                console.log('Professor não encontrado com matrícula:', matricula);
                return false;
            }
            
            const professor = professores[0];
            console.log('Professor encontrado:', professor);
            console.log('Data de nascimento no JSON:', professor.dataNascimento);
            console.log('Senha digitada:', senha);
            console.log('Senha salva:', professor.senha);
            
            // Validar senha (pode ser data de nascimento ou senha customizada)
            const senhaValida = validarSenha(senha, professor.dataNascimento, professor.senha);
            
            if (senhaValida) {
                // Verificar se a senha é a data de nascimento (primeiro login)
                const dataConvertida = converterDataParaFormatoJSON(senha);
                const precisaTrocarSenha = (professor.dataNascimento && dataConvertida === professor.dataNascimento) || 
                                         (professor.senhaTrocada === false) ||
                                         (professor.senha === professor.dataNascimento);
                
                console.log('Senha válida! Precisa trocar senha:', precisaTrocarSenha);
                
                // Criar sessão
                const sessao = {
                    tipo: 'professor',
                    usuarioId: professor.id,
                    matricula: professor.matricula,
                    dataLogin: new Date().toISOString(),
                    precisaTrocarSenha: precisaTrocarSenha
                };
                
                try {
                    const responseSessao = await fetch(`${window.API_URL}/sessoes`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(sessao)
                    });
                    
                    if (responseSessao.ok) {
                        const sessaoData = await responseSessao.json();
                        localStorage.setItem('sessaoProfessor', JSON.stringify(sessaoData));
                    } else {
                        localStorage.setItem('sessaoProfessor', JSON.stringify(sessao));
                    }
                } catch (error) {
                    console.warn('Erro ao criar sessão na API:', error);
                    localStorage.setItem('sessaoProfessor', JSON.stringify(sessao));
                }
                
                localStorage.setItem('tipoUsuario', 'professor');
                localStorage.setItem('usuarioId', professor.id);
                localStorage.setItem('precisaTrocarSenha', precisaTrocarSenha ? 'true' : 'false');
                localStorage.setItem('usuarioData', JSON.stringify(professor));
                return true;
            } else {
                console.log('Senha inválida');
                return false;
            }
        }
        
        return false;
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        return false;
    }
}

// Função para verificar se o usuário está autenticado
function verificarAutenticacao(tipoEsperado) {
    const tipoUsuario = localStorage.getItem('tipoUsuario');
    const usuarioId = localStorage.getItem('usuarioId');
    
    if (!tipoUsuario || !usuarioId) {
        return false;
    }
    
    if (tipoEsperado && tipoUsuario !== tipoEsperado) {
        return false;
    }
    
    return true;
}

// Função para fazer logout
function fazerLogout() {
    localStorage.removeItem('sessaoAluno');
    localStorage.removeItem('sessaoProfessor');
    localStorage.removeItem('sessaoAdmin');
    localStorage.removeItem('tipoUsuario');
    localStorage.removeItem('usuarioId');
    window.location.href = '../index.html';
}

// Função para obter ID do usuário logado
function obterUsuarioId() {
    return localStorage.getItem('usuarioId');
}

// Função para obter tipo de usuário
function obterTipoUsuario() {
    return localStorage.getItem('tipoUsuario');
}

// Função para redirecionar se não autenticado
function redirecionarSeNaoAutenticado(tipoEsperado) {
    if (!verificarAutenticacao(tipoEsperado)) {
        if (tipoEsperado === 'admin') {
            window.location.href = '../admin-login.html';
        } else {
            window.location.href = '../login.html';
        }
    }
}

// Função para obter dados do usuário atual (current user)
async function obterCurrentUser() {
    const tipoUsuario = obterTipoUsuario();
    const usuarioId = obterUsuarioId();
    
    if (!tipoUsuario || !usuarioId) {
        return null;
    }
    
    try {
        const endpoint = tipoUsuario === 'aluno' ? 'alunos' : tipoUsuario === 'professor' ? 'professores' : null;
        if (!endpoint) return null;
        
        const response = await fetch(`${window.API_URL}/${endpoint}/${usuarioId}`);
        if (!response.ok) {
            console.warn(`Erro ao buscar ${endpoint}/${usuarioId}:`, response.status, response.statusText);
            return null;
        }
        
        const usuario = await response.json();
        
        if (!usuario || !usuario.id) {
            console.warn('Dados do usuário inválidos:', usuario);
            return null;
        }
        
        // Verificar se os dados mudaram antes de atualizar
        const dadosAntigosStr = localStorage.getItem('usuarioData');
        const dadosMudaram = !dadosAntigosStr || JSON.stringify(usuario) !== dadosAntigosStr;
        
        // Atualizar localStorage com dados atualizados
        localStorage.setItem('usuarioData', JSON.stringify(usuario));
        
        // Disparar evento se os dados mudaram
        if (dadosMudaram) {
            window.dispatchEvent(new CustomEvent('currentUserUpdated', {
                detail: { usuario, tipoUsuario }
            }));
        }
        
        return usuario;
    } catch (error) {
        console.error('Erro ao obter current user:', error);
        return null;
    }
}

// Função para atualizar current user periodicamente
function iniciarAtualizacaoCurrentUser(intervalo = 30000) { // 30 segundos por padrão
    // Atualizar imediatamente
    obterCurrentUser();
    
    // Atualizar periodicamente
    return setInterval(() => {
        obterCurrentUser();
    }, intervalo);
}

// Função para parar atualização de current user
function pararAtualizacaoCurrentUser(intervalId) {
    if (intervalId) {
        clearInterval(intervalId);
    }
}

