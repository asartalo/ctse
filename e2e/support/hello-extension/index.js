/* global document */
function sayHello() {
  const body = document.querySelector('body');
  const p = document.createElement('p');
  p.id = 'ctse-hello-extension';
  p.textContent = 'Hello CtSe';
  body.appendChild(p);
}

sayHello();
