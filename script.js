// 무작위 셔플
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// DOM이 완전히 로드된 후 스크립트 실행
document.addEventListener('DOMContentLoaded', () => {
    
    // DOM 요소 정의
    const inputEl   = document.getElementById('input');
    const startBtn  = document.getElementById('startBtn');
    const resetBtn  = document.getElementById('resetBtn');
    const cardsEl   = document.getElementById('cards');
    const countEl   = document.getElementById('count');
    const probEl    = document.getElementById('prob');
    const msgEl     = document.getElementById('msg');
    const promptEl  = document.getElementById('prompt');

    let isSelectionEnabled = false;
    let finalChoices = [];
    let selectedCardIndex = -1;
    
    let globalZIndex = 1000; 

    // =========================================================
    // 입력값 파싱 헬퍼 함수들
    // =========================================================

    // 문자열을 쉼표(,)로 나누되, 괄호 () 안의 쉼표는 무시
    function splitByComma(str) {
        const parts = [];
        let current = '';
        let depth = 0;
        
        for (let i = 0; i < str.length; i++) {
            const char = str[i];
            if (char === '(') depth++;
            else if (char === ')') depth--;
            
            if (char === ',' && depth === 0) {
                parts.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        if (current) parts.push(current);
        return parts;
    }

    // 문자열이 괄호로 감싸져 있는지 확인
    function isWrappedInParens(str) {
        if (!str.startsWith('(') || !str.endsWith(')')) return false;
        let depth = 0;
        for (let i = 0; i < str.length; i++) {
            if (str[i] === '(') depth++;
            else if (str[i] === ')') depth--;
            
            // 마지막 문자가 아닌데 괄호가 닫힌 경우
            if (depth === 0 && i < str.length - 1) {
                return false; 
            }
        }
        return depth === 0;
    }


    // 입력 문자열 분석 최종 항목 리스트 반환
    function parseInput(text) {
        let results = [];
        const chunks = splitByComma(text);
        
        chunks.forEach(chunk => {
            chunk = chunk.trim();
            if (!chunk) return;

            // "내용 * 숫자" 형식인지 확인 (마지막 * 기준, 정규식 이용)
            const multiplierMatch = chunk.match(/^(.*)\*\s*(\d+)$/);
            
            if (multiplierMatch) {
                // 곱하기가 있는 경우
                let base = multiplierMatch[1].trim();
                const count = parseInt(multiplierMatch[2], 10);
                
                // base가 괄호로 감싸져 있다면 괄호 제거 후 재귀 호출
                if (isWrappedInParens(base)) {
                    const innerContent = base.slice(1, -1); // 괄호 제거
                    const innerItems = parseInput(innerContent); // 재귀적 파싱
                    
                    // 결과 items를 count만큼 반복해서 추가
                    for(let k = 0; k < count; k++) {
                        results.push(...innerItems);
                    }
                } else {
                    // 단순 항목 처리
                    for(let k = 0; k < count; k++) {
                        results.push(base);
                    }
                }
            } else {
                // 곱하기가 없는 경우
                // 괄호만 있는 경우 처리
                if (isWrappedInParens(chunk)) {
                    const innerContent = chunk.slice(1, -1);
                    results.push(...parseInput(innerContent));
                } else {
                    // 일반 텍스트
                    results.push(chunk);
                }
            }
        });
        return results;
    }

    // =========================================================
    // 입력 처리 및 초기 설정
    // =========================================================

    // 카드 생성 및 섞기 시작 버튼 클릭 이벤트
    startBtn.addEventListener('click', () => {
        const rawInput = inputEl.value;
        
        finalChoices = parseInput(rawInput);

        if (finalChoices.length < 2) {
            alert('최소 2개 이상의 선택지를 입력해주세요.');
            return;
        }
        
        // 초기화
        globalZIndex = 1000; 

        // 1.실제 데이터 셔플
        shuffleArray(finalChoices);

        // 2.상태 업데이트
        updateUIForShuffling(finalChoices);

        // 3.카드 생성 (DOM 생성 및 초기 위치 설정)
        createCards(finalChoices);

        // 애니메이션 타이밍 로직

        // 카드 펼치기 애니메이션 시작
        spreadCards();
        
        // 1.펼치기 시간 (1.2초)
        const spreadTime = 1200; 

        // 2.섞기 시간
        const shuffleTime = 1400;

        // 3.복귀 시간
        const restoreTime = 600;

        // 섞기 애니메이션 시작 (펼쳐진 후)
        setTimeout(() => {
            shuffleCards(finalChoices.length);
        }, spreadTime);  // 1.2초 후 섞기 시작

        // 버튼 텍스트 변경
        startBtn.textContent = '선택 준비 중...';
        startBtn.disabled = true;

        // 애니메이션이 끝난 후 선택 가능 상태로 변경
        
        // 섞기 후 정돈된 위치로 복귀 (펼치기 + 섞기 이후)
        setTimeout(() => {
            restoreCardOrder(); 
        }, spreadTime + shuffleTime); 

        // 모든 애니메이션이 끝난 후 선택 활성화
        setTimeout(() => {
            enableSelection();
            startBtn.textContent = '선택 완료!';
            // startBtn.disabled = true; 
        }, spreadTime + shuffleTime + restoreTime);
    });

    // 초기화 버튼 이벤트
    resetBtn.addEventListener('click', () => {
        // UI 초기화
        cardsEl.innerHTML = '<p id="prompt" class="text-gray-400">선택지를 입력하고 \'카드 생성\' 버튼을 눌러주세요。</p>';
        
        countEl.textContent = '0';
        probEl.querySelector('#list')?.remove();
        msgEl.classList.add('hidden');
        startBtn.textContent = '카드 생성 및 섞기 시작';
        startBtn.disabled = false;
        isSelectionEnabled = false;
        finalChoices = [];
        selectedCardIndex = -1;
        // prompt가 reset 시점에 null일 수 있으므로 확인
        const prompt = document.getElementById('prompt');
        if (prompt) {
            prompt.classList.remove('hidden');
        }
    });

    // =========================================================
    // 무작위 선택 및 룰렛 기능
    // =========================================================

    // UI를 섞기 단계로 업데이트
    function updateUIForShuffling(choices) {
        // prompt가 null일 수 있으므로 확인
        const prompt = document.getElementById('prompt');
        if (prompt) {
            prompt.classList.add('hidden');
        }
        
        // 확률 정보 표시
        const totalCount = choices.length;
        countEl.textContent = totalCount;
        
        // 선택지별 횟수를 계산하기 위한 객체 생성
        const choiceCounts = {};
        choices.forEach((choice) => {
            choiceCounts[choice] = (choiceCounts[choice] || 0) + 1;
        });
        
        const probabilityList = document.createElement('ul');
        probabilityList.id = 'list';
        probabilityList.className = 'mt-2 text-gray-400';
        
        // 객체별 확률 리스트 생성
        Object.keys(choiceCounts).forEach((choice) => {
            const count = choiceCounts[choice];
            const percentage = (count / totalCount) * 100;

            const li = document.createElement('li');
            // 계산된 횟수와 확률을 표시
            li.textContent = `${choice}: ${count}/${totalCount} (${percentage.toFixed(1)}%)`;
            probabilityList.appendChild(li);
        });

        probEl.querySelector('#list')?.remove();
        probEl.appendChild(probabilityList);
    }

    // 카드를 생성하고, 최종 위치를 계산하여 dataset에 저장
    // 애니메이션 초기 위치로 transform 설정
    function createCards(choices) {
        cardsEl.innerHTML = ''; // 기존 내용 삭제
        
        const totalCards = choices.length;
        const fanAngle = 120;   // 총 각도 범위 (도)
        const overlap = 40;     // 카드 사이 간격 (px)
        const baseRadius = 50;  // 기본 Y 위치 (px)
        const initialRotation = - (fanAngle / 2); // 시작 각도 조정 (중앙 정렬)

        choices.forEach((choice, index) => {
            // 카드 DOM 요소 생성
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            cardElement.dataset.choice = choice;
            cardElement.dataset.index = index;
            
            const front = document.createElement('div');
            front.className = 'front';
            front.textContent = choice;
            
            const back = document.createElement('div');
            back.className = 'back';
            
            cardElement.appendChild(front);
            cardElement.appendChild(back);
            
            // 둥근 부채꼴 배치 계산
            const rotation = initialRotation + (fanAngle / (totalCards - 1 || 1)) * index;
            const translateX = (index - (totalCards - 1) / 2) * overlap;
            const centerIndex = (totalCards - 1) / 2;
            const distanceFromCenter = Math.abs(index - centerIndex);
            const curveFactor = 25; 
            const additionalY = Math.pow(distanceFromCenter, 2) * (curveFactor / totalCards);
            const totalY = baseRadius + additionalY;
            
            const finalTransform = `
                translateY(${totalY}px)
                translateX(${translateX}px) 
                rotateZ(${rotation}deg) 
                translateZ(${index * 0.1}px) 
            `; 

            // 최종 정돈된 위치를 데이터셋에 저장
            cardElement.dataset.finalTransform = finalTransform;
            
            // 초기 배치 (애니메이션 시작점)
            cardElement.style.transform = `translateY(${totalY + 50}px) rotateZ(0deg)`; // 아래에서 등장
            
            // DOM에 추가
            cardsEl.appendChild(cardElement);
        });
    }

    // 부채꼴 애니메이션 실행
    function spreadCards() {
        const cards = document.querySelectorAll('.card');
        cards.forEach((card, index) => {
            // 순차적 등장 애니메이션
            setTimeout(() => {
                card.style.transform = card.dataset.finalTransform;
            }, 100 + index * 50); 
        });
    }
    
    // 셔플 애니메이션
    function shuffleCards() {
        const cards = document.querySelectorAll('.card');
        
        cards.forEach(card => {
            // 중앙으로 이동하며 세로로 정렬 (rotate(0deg))
            card.style.transform = `translate(0px, 50px) rotate(0deg)`;
        });

        // 800ms 동안 깜빡이도록 (모이는 시간 600ms)
        const blinkStartTime = 600; 
        setTimeout(() => {
            cards.forEach(card => {
                card.classList.add('shuffling'); 
            });
        }, blinkStartTime); 

        // 800ms 후 깜빡임 중지 (shuffleTime 1400ms에 맞춤)
        setTimeout(() => {
            cards.forEach(card => {
                card.classList.remove('shuffling');
            });
        }, blinkStartTime + 800);
    }
    
    // 섞기 애니메이션 후 정돈된 부채꼴 위치로 복귀.
    function restoreCardOrder() {
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            card.classList.remove('shuffling'); // 남아있는 경우 제거
            // 저장된 최종 정돈 위치로 복귀
            card.style.transform = card.dataset.finalTransform; 
        });
    }


    // 카드를 선택할 수 있도록 이벤트 리스너 추가
    function enableSelection() {
        isSelectionEnabled = true;
        msgEl.textContent = '카드를 클릭하여 선택 결과를 확인하세요! (여러 장 선택 가능)';
        msgEl.classList.remove('hidden');

        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            card.addEventListener('click', handleCardSelection);
            
            // Hover 시 살짝 띄우는 효과 추가 (선택된 카드는 제외)
            card.addEventListener('mouseenter', () => {
                if (isSelectionEnabled && !card.classList.contains('selected') && !card.classList.contains('discarded')) {       
                    card.classList.add('hover:scale-105', 'hover:shadow-2xl');
                    card.style.zIndex = 50;     // 마우스 오버 시 z-index를 높여서 강조
                }
            }); 
            card.addEventListener('mouseleave', () => {
                if (isSelectionEnabled) {
                    card.classList.remove('hover:scale-105', 'hover:shadow-2xl');
                    // 선택된 카드가 아닐 때만 z-index 복구
                    if (!card.classList.contains('selected')) {
                        card.style.zIndex = ''; 
                    }
                }
            });
        });
    }

    // 사용자가 카드를 클릭했을 때 실행되는 핸들러
    function handleCardSelection(event) {
        if (!isSelectionEnabled) {
            return; 
        }
        
        const selectedCard = event.currentTarget;
        
        // 이미 선택되거나 버려진 카드는 무시
        if (selectedCard.classList.contains('selected') || selectedCard.classList.contains('discarded')) return;

        const finalChoice = selectedCard.dataset.choice;

        // 이전에 선택된 카드(중앙에 있는 카드)들을 찾아 사라지게 처리
        const previouslySelected = document.querySelectorAll('.card.selected');
        previouslySelected.forEach(card => {
            card.classList.remove('selected');
            card.classList.add('discarded'); // 사라지는 애니메이션 적용
        });

        // Hover 효과 즉시 제거
        selectedCard.classList.remove('hover:scale-105', 'hover:shadow-2xl');

        // 새 카드를 선택 상태로 만들고 z-index 최상위로 설정
        globalZIndex++;
        selectedCard.classList.add('selected'); 
        selectedCard.style.zIndex = globalZIndex;
        
        // 최종 결과 출력
        msgEl.textContent = `이번 선택: ${finalChoice} (다른 카드도 뽑아보세요!)`;
        msgEl.style.color = '#7dff7d'; 
    }
});
