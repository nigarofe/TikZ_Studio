# Input
Pontos A(0,0), B(2,0), C(4,0), D(0,-1.5), E(2,-1.5), F(4,-1.5)
Vigas AB, BC, CF, FE, ED, DA, BD, BE, BF
Apoio móvel em D, apoio fixo em F
10kN aplicada para baixo em A
6kN aplicada para direita em A
5kN aplicado para baixo em B
10kN aplicado para baixo em C


# stanli package instructions

Parameters in brackets are optional 
- Where there is a lineload notation, use above=13mm
- Where there is a single load notation, when the load is a moment, use above=4mm
- Where there is single load notation, when the load is pointing down, it shall be used [above=12mm] and vice versa
- Where there is single load notation, when the load is pointing left, it shall be used [right=12mm] and vice versa

- The offset of the dimensioning shall be calculated to not overlap with the structure, notation or supports (e.g. 25mm for a vertical dimensioning if there's a horizontal load next to it; 30mm for a horizontal dimensioning if there's a support above it)

3.2.3 Supports and bearings
\support{type}{insertion point}[rotation];
- type 1 = fixed bearing, which can absorb both horizontal and vertical forces, but no moments.
- type 2 = floating bearing, which can absorb forces only in one direction and no moments
- type 3 = fixed support which can absorb all forces and moments
- type 4 = fixed support which can only absorb forces in one direction and moments
- type 5 = spring
- type 6 = torsion spring

3.2.5 Single load
\load{type}{insertion point}[rotation][length or included angle][load distance from insertion point];
- type 1 = single force
- type 2 = clockwise moment
- type 3 = counterclockwise moment

rotation 0 = left, 90 = down, 180 = right, 270 = up

3.2.6 Line loads
\lineload{type}{initial point}{end point}[optional][optional][optional][optional];
- type 1 = linear load that is normal to the beam axis
- type 2 = the forces are parallel to the y-axis
- type 3 = projection of the forces on the beam
- type 4 = line load along the bar axis

3.2.9 Dimensioning
\dimensioning{type}{initial point}{end point}{distance from point of origin}[measure];
- type 1 = horizontal dimension
- type 2 = vertical dimension

3.2.11 Labeling and notation
\notation{type}{insertion point}{}[][][];

# Examples
## Example 1
**Input**
Pontos A(0,0), B(2,0) e C(4,0)
Apoio fixo em A e apoio móvel em C
Carga distribuída de 3kN/m entre A e B
Momento horário de 6kNm aplicado em C

**Output**
```tex
% Pontos A(0,0), B(2,0) e C(4,0)
% Apoio fixo em A e apoio móvel em C
% Carga distribuída de 3kN/m entre A e B
% Momento horário de 6kNm aplicado em C

\documentclass[tikz]{standalone}
\usepackage{stanli}
\usetikzlibrary{calc} % Ensures coordinate math works perfectly

\begin{document}
\begin{tikzpicture}
    \point{A}{0}{0}
    \point{B}{2}{0}
    \point{C}{4}{0}
    
    % Offset points so the notation doesn't overlap
    \point{A'}{0}{5pt}
    \point{B'}{2}{5pt}
    \point{C'}{4}{5pt}

    \support{1}{A}
    \support{2}{C}

    \beam{1}{A}{C}
    
    \lineload{1}{A'}{B'}
    \load{2}{C'}[0][150]

    \notation{1}{A}{A}[above]
    \notation{1}{B}{B}[above]
    \notation{1}{C}{C}[above]
    \notation{1}{C'}{6kNm}[above=4mm]
    \notation{5}{A'}{B'}[3kN/m][.5][above=13mm]

    \dimensioning{1}{A}{B}{-15mm}[2m]
    \dimensioning{1}{B}{C}{-15mm}[2m]
\end{tikzpicture}
\end{document}
```

## Example 2
**Input**
Pontos A(0,0), B(0,3), C(5,3), D(5,0)
Apoio móvel em A, apoio fixo em D
Carga de 10kN aplicada entre A e B (ponto médio M em 0, 1.5)
Carga distribuída de 6kN/m entre B e C

**Output**
```tex
% Pontos A(0,0), B(0,3), C(5,3), D(5,0)
% Apoio móvel em A, apoio fixo em D
% Carga de 10kN aplicada entre A e B (ponto médio M em 0, 1.5)
% Carga distribuída de 6kN/m entre B e C

\documentclass[tikz]{standalone}
\usepackage{stanli}
\usetikzlibrary{calc}

\begin{document}
\begin{tikzpicture}
    % Definição dos pontos principais
    \point{A}{0}{0}
    \point{B}{0}{3}
    \point{C}{5}{3}
    \point{D}{5}{0}
    
    % Ponto médio para a carga pontual de 10kN
    \point{M}{0}{1.5}

    % Definição dos apoios
    \support{2}{A} % Apoio móvel
    \support{1}{D} % Apoio fixo

    % Definição das barras (pórtico)
    \beam{1}{A}{B}
    \beam{1}{B}{C}
    \beam{1}{C}{D}

    % Cargas
    % Carga pontual de 10kN no meio da barra AB (sentido horizontal para a direita)
    \load{1}{M}[0] 
    
    % Carga distribuída de 6kN/m na barra BC
    \lineload{1}{B}{C}

    % Notações e Etiquetas
    \notation{1}{A}{A}[left]
    \notation{1}{B}{B}[above left]
    \notation{1}{C}{C}[above right]
    \notation{1}{D}{D}[right]
    
    \notation{1}{M}{10kN}[right=12mm]
        \notation{5}{B}{C}[6kN/m][.5][above=13mm]

    \dimensioning{2}{A}{M}{-10mm}[1.5m]
    \dimensioning{2}{M}{B}{-10mm}[1.5m]
    \dimensioning{1}{B}{C}{-15mm}[5m]
\end{tikzpicture}
\end{document}
```

## Example 3
**Input**
Pontos A(0,0), B(2,0), C(4,0), D(0,-1.5), E(2,-1.5), F(4,-1.5)
Vigas AB, BC, CF, FE, ED, DA, BD, BE, BF
Apoio móvel em D, apoio fixo em F
10kN aplicada para baixo em A
6kN aplicada para direita em A
5kN aplicado para baixo em B
10kN aplicado para baixo em C

**Output**
```tex
% Pontos A(0,0), B(2,0), C(4,0), D(0,-1.5), E(2,-1.5), F(4,-1.5)
% Vigas AB, BC, CF, FE, ED, DA, BD, BE, BF
% Apoio móvel em D, apoio fixo em F
% 10kN aplicada para baixo em A, 6kN aplicada para direita em A
% 5kN aplicado para baixo em B, 10kN aplicado para baixo em C

\documentclass[tikz]{standalone}
\usepackage{stanli}
\usetikzlibrary{calc}

\begin{document}
\begin{tikzpicture}
    % Definição dos pontos
    \point{A}{0}{0}
    \point{B}{2}{0}
    \point{C}{4}{0}
    \point{D}{0}{-1.5}
    \point{E}{2}{-1.5}
    \point{F}{4}{-1.5}

    % Definição das vigas/barras
    \beam{1}{A}{B}
    \beam{1}{B}{C}
    \beam{1}{C}{F}
    \beam{1}{F}{E}
    \beam{1}{E}{D}
    \beam{1}{D}{A}
    \beam{1}{B}{D}
    \beam{1}{B}{E}
    \beam{1}{B}{F}

    % Apoios
    \support{2}{D} % Apoio móvel em D
    \support{1}{F} % Apoio fixo em F

    % Cargas pontuais
    % A: 10kN para baixo (90) e 6kN para direita (180)
    \load{1}{A}[90]
    \load{1}{A}[180]
    
    % B: 5kN para baixo (90)
    \load{1}{B}[90]
    
    % C: 10kN para baixo (90)
    \load{1}{C}[90]

    % Notações de cargas e pontos
    \notation{1}{A}{A}[above left]
    \notation{1}{B}{B}[above right]
    \notation{1}{C}{C}[above right]
    \notation{1}{D}{D}[left]
    \notation{1}{E}{E}[below]
    \notation{1}{F}{F}[right]

    % Etiquetas de valores das cargas (conforme regras de offset)
    \notation{1}{A}{10kN}[above=12mm]
    \notation{1}{A}{6kN}[left=12mm]
    \notation{1}{B}{5kN}[above=12mm]
    \notation{1}{C}{10kN}[above=12mm]

    % Dimensionamento
    % Horizontal (distância negativa para ficar abaixo da estrutura)
    \dimensioning{1}{D}{E}{-30mm}[2m]
    \dimensioning{1}{E}{F}{-30mm}[2m]
    
    % Vertical (distância negativa para ficar à esquerda, compensando a carga em A)
    \dimensioning{2}{D}{A}{-30mm}[1.5m]

\end{tikzpicture}
\end{document}
```