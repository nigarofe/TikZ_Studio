# Input
- Pontos A(0,0), B(0,3), C(5,3), D(5,0)
- Apoio móvel em A, apoio fixo em D
- Carga de 10kN aplicada entre A e B
- Carga distribuída de 6kN/m entre B e C


# stanli package instructions

Parameters in brackets are optional 
- For lineload notation, use above=13mm
- For single load notation, when the load is a moment, use above=4mm
- For single load notation, when the load is pointing left, use right=12mm and vice versa

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
- Pontos A(0,0), B(2,0) e C(4,0)
- Apoio fixo em A e apoio móvel em C
- Carga distribuída de 3kN/m entre A e B
- Momento horário de 6kNm aplicado em C

**Output**
```tex
% - Pontos A(0,0), B(2,0) e C(4,0)
% - Apoio fixo em A e apoio móvel em C
% - Carga distribuída de 3kN/m entre A e B
% - Momento horário de 6kNm aplicado em C

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
- Pontos A(0,0), B(0,3), C(5,3), D(5,0)
- Apoio móvel em A, apoio fixo em D
- Carga de 10kN aplicada entre A e B (ponto médio M em 0, 1.5)
- Carga distribuída de 6kN/m entre B e C

**Output**
```tex
% - Pontos A(0,0), B(0,3), C(5,3), D(5,0)
% - Apoio móvel em A, apoio fixo em D
% - Carga de 10kN aplicada entre A e B (ponto médio M em 0, 1.5)
% - Carga distribuída de 6kN/m entre B e C

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