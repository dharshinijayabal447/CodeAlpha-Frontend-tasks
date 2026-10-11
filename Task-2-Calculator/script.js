const expressionDisplay=document.getElementById("expression");
const resultDisplay=document.getElementById("result");
const displayBox=document.getElementById("displayBox");
const keypad=document.getElementById("keypad");
const themeToggle=document.getElementById("themeToggle");
const historyList=document.getElementById("historyList");
const clearHistoryButton=document.getElementById("clearHistory");

let currentInput="0";
let previousValue=null;
let currentOperator=null;
let waitingForNext=false;
let justCalculated=false;
let calculationHistory=[];

try{
  const savedHistory=JSON.parse(localStorage.getItem("calcspaceHistory")||"[]");
  if(Array.isArray(savedHistory))calculationHistory=savedHistory;
}catch(error){calculationHistory=[]}

function formatNumber(value){
  if(!Number.isFinite(value))return "Error";
  if(Object.is(value,-0))return "0";
  return Number.parseFloat(value.toPrecision(11)).toString();
}
function animateDisplay(){
  displayBox.classList.remove("pulse");
  resultDisplay.classList.remove("result-pop");
  void displayBox.offsetWidth;
  displayBox.classList.add("pulse");
  resultDisplay.classList.add("result-pop");
}
function updateDisplay(animate=true){
  resultDisplay.textContent=currentInput;
  document.querySelectorAll("[data-operator]").forEach(button=>button.classList.toggle("selected",button.dataset.operator===currentOperator&&!waitingForNext));
  if(animate)animateDisplay();
}
function renderHistory(){
  historyList.replaceChildren();
  if(calculationHistory.length===0){
    const empty=document.createElement("p");
    empty.className="empty-history";
    empty.textContent="Your calculations will appear here.";
    historyList.appendChild(empty);
    return;
  }
  calculationHistory.forEach((item,index)=>{
    const button=document.createElement("button");
    button.type="button";
    button.className="history-entry";
    button.dataset.historyIndex=String(index);
    const details=document.createElement("span");
    const calculation=document.createElement("span");
    calculation.className="history-calculation";
    calculation.textContent=item.calculation;
    const answer=document.createElement("span");
    answer.className="history-answer";
    answer.textContent=`= ${item.result}`;
    details.append(calculation,answer);
    const reuse=document.createElement("span");
    reuse.className="history-reuse";
    reuse.textContent="USE RESULT ↗";
    button.append(details,reuse);
    historyList.appendChild(button);
  });
}
function saveHistory(calculation,result){
  calculationHistory.unshift({calculation,result:String(result),time:Date.now()});
  calculationHistory=calculationHistory.slice(0,20);
  try{localStorage.setItem("calcspaceHistory",JSON.stringify(calculationHistory))}catch(error){}
  renderHistory();
}
function enterNumber(number){
  if(currentInput==="Error"||waitingForNext||justCalculated){currentInput=number;waitingForNext=false;justCalculated=false}
  else if(currentInput==="0")currentInput=number;
  else if(currentInput.replace("-","").replace(".","").length<14)currentInput+=number;
  updateDisplay();
}
function enterDecimal(){
  if(currentInput==="Error"||waitingForNext||justCalculated){currentInput="0.";waitingForNext=false;justCalculated=false}
  else if(!currentInput.includes("."))currentInput+=".";
  updateDisplay();
}
function clearCalculator(){
  currentInput="0";previousValue=null;currentOperator=null;waitingForNext=false;justCalculated=false;
  expressionDisplay.textContent="Ready to calculate";updateDisplay();
}
function deleteLast(){
  if(currentInput==="Error"||waitingForNext||justCalculated){currentInput="0";waitingForNext=false;justCalculated=false}
  else{currentInput=currentInput.length>1?currentInput.slice(0,-1):"0";if(currentInput==="-")currentInput="0"}
  updateDisplay();
}
function calculate(a,operator,b){
  if(operator==="+")return a+b;
  if(operator==="−")return a-b;
  if(operator==="×")return a*b;
  if(operator==="÷")return b===0?NaN:a/b;
  return b;
}
function chooseOperator(operator){
  if(currentInput==="Error")return;
  const inputValue=Number(currentInput);
  if(currentOperator&&!waitingForNext){
    const result=calculate(previousValue,currentOperator,inputValue);
    if(!Number.isFinite(result)){currentInput="Error";expressionDisplay.textContent="Cannot divide by zero";previousValue=null;currentOperator=null;waitingForNext=true;updateDisplay();return}
    currentInput=formatNumber(result);previousValue=result;
  }else previousValue=inputValue;
  currentOperator=operator;waitingForNext=true;justCalculated=false;
  expressionDisplay.textContent=`${formatNumber(previousValue)} ${operator}`;updateDisplay();
}
function showResult(){
  if(!currentOperator||previousValue===null||currentInput==="Error")return;
  const secondValue=Number(currentInput);
  const firstValue=previousValue;
  const operator=currentOperator;
  const calculation=`${formatNumber(firstValue)} ${operator} ${formatNumber(secondValue)}`;
  const result=calculate(firstValue,operator,secondValue);
  expressionDisplay.textContent=`${calculation} =`;
  if(Number.isFinite(result)){
    currentInput=formatNumber(result);
    saveHistory(calculation,currentInput);
  }else{
    currentInput="Error";
    expressionDisplay.textContent="Cannot divide by zero";
  }
  previousValue=null;currentOperator=null;waitingForNext=false;justCalculated=true;updateDisplay();
}
function usePercent(){if(currentInput==="Error")return;currentInput=formatNumber(Number(currentInput)/100);justCalculated=false;updateDisplay()}
function changeSign(){if(currentInput==="Error"||Number(currentInput)===0)return;currentInput=currentInput.startsWith("-")?currentInput.slice(1):`-${currentInput}`;updateDisplay()}
function handleAction(action){
  if(action==="clear")clearCalculator();
  if(action==="delete")deleteLast();
  if(action==="decimal")enterDecimal();
  if(action==="equals")showResult();
  if(action==="percent")usePercent();
  if(action==="sign")changeSign();
}
keypad.addEventListener("click",event=>{
  const button=event.target.closest("button");
  if(!button)return;
  const rect=button.getBoundingClientRect();
  const size=Math.max(rect.width,rect.height);
  const ripple=document.createElement("span");
  ripple.className="ripple";
  ripple.style.width=`${size}px`;
  ripple.style.height=`${size}px`;
  ripple.style.left=`${event.clientX-rect.left-size/2}px`;
  ripple.style.top=`${event.clientY-rect.top-size/2}px`;
  button.appendChild(ripple);
  ripple.addEventListener("animationend",()=>ripple.remove(),{once:true});
  if(button.dataset.number!==undefined)enterNumber(button.dataset.number);
  if(button.dataset.operator)chooseOperator(button.dataset.operator);
  if(button.dataset.action)handleAction(button.dataset.action);
});
historyList.addEventListener("click",event=>{
  const button=event.target.closest("[data-history-index]");
  if(!button)return;
  const item=calculationHistory[Number(button.dataset.historyIndex)];
  if(!item)return;
  currentInput=item.result;previousValue=null;currentOperator=null;waitingForNext=false;justCalculated=true;
  expressionDisplay.textContent=`Reused result from: ${item.calculation}`;
  updateDisplay();
});
clearHistoryButton.addEventListener("click",()=>{
  calculationHistory=[];
  try{localStorage.removeItem("calcspaceHistory")}catch(error){}
  renderHistory();
});
document.addEventListener("keydown",event=>{
  if(/^[0-9]$/.test(event.key)){enterNumber(event.key);return}
  if(event.key===".")enterDecimal();
  if(event.key==="+")chooseOperator("+");
  if(event.key==="-")chooseOperator("−");
  if(event.key==="*")chooseOperator("×");
  if(event.key==="/"){event.preventDefault();chooseOperator("÷")}
  if(event.key==="Enter"||event.key==="="){event.preventDefault();showResult()}
  if(event.key==="Escape")clearCalculator();
  if(event.key==="Backspace")deleteLast();
  if(event.key==="%")usePercent();
});
themeToggle.addEventListener("click",()=>{
  document.body.classList.toggle("dark");
  const dark=document.body.classList.contains("dark");
  themeToggle.textContent=dark?"☼":"◐";
  try{localStorage.setItem("calcspaceTheme",dark?"dark":"light")}catch(error){}
});
try{
  if(localStorage.getItem("calcspaceTheme")==="dark"){
    document.body.classList.add("dark");
    themeToggle.textContent="☼";
  }
}catch(error){}
renderHistory();
updateDisplay(false);\n