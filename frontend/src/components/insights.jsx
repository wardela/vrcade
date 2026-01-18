import React from 'react';
import styled from 'styled-components';

const InsightsButton = () => {
  return (
    <StyledWrapper>
<button className="button">
  <span className="btn-text"> <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-5">
  <path d="M15.98 1.804a1 1 0 0 0-1.96 0l-.24 1.192a1 1 0 0 1-.784.785l-1.192.238a1 1 0 0 0 0 1.962l1.192.238a1 1 0 0 1 .785.785l.238 1.192a1 1 0 0 0 1.962 0l.238-1.192a1 1 0 0 1 .785-.785l1.192-.238a1 1 0 0 0 0-1.962l-1.192-.238a1 1 0 0 1-.785-.785l-.238-1.192ZM6.949 5.684a1 1 0 0 0-1.898 0l-.683 2.051a1 1 0 0 1-.633.633l-2.051.683a1 1 0 0 0 0 1.898l2.051.684a1 1 0 0 1 .633.632l.683 2.051a1 1 0 0 0 1.898 0l.683-2.051a1 1 0 0 1 .633-.633l2.051-.683a1 1 0 0 0 0-1.898l-2.051-.683a1 1 0 0 1-.633-.633L6.95 5.684ZM13.949 13.684a1 1 0 0 0-1.898 0l-.184.551a1 1 0 0 1-.632.633l-.551.183a1 1 0 0 0 0 1.898l.551.183a1 1 0 0 1 .633.633l.183.551a1 1 0 0 0 1.898 0l.184-.551a1 1 0 0 1 .632-.633l.551-.183a1 1 0 0 0 0-1.898l-.551-.184a1 1 0 0 1-.633-.632l-.183-.551Z" />
</svg>
 Generate Insights</span>
  <div className="hoverEffect">
    <div />
  </div>
</button>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 5px 30px;
  position: relative;
  overflow: hidden;
  border-radius: 0.5rem;
  transition: all 0.2s ease-in-out;
  font-weight: 500;
  cursor: pointer;

  /* Background */
  background: linear-gradient(90deg, #03102f, #5ce1e6);
  box-shadow: 0 0px 7px -5px rgba(0, 0, 0, 0.5);

  /* Animated gradient border */
  border: 3px solid transparent;
  background-image: 
    linear-gradient(90deg, #03102f, #5ce1e6), 
    linear-gradient(270deg, #5ce1e6, #1c56dd, #5ce1e6);
  background-origin: border-box;
  background-clip: padding-box, border-box;
  animation: borderShift 5s linear infinite;
}

/* ✅ Text is independent of gradient clipping */
.btn-text {
  display: inline-flex;        /* put icon + text side by side */
  align-items: center;         /* vertically center them */
  gap: 0.5rem;                 /* space between icon & text */
  color: #ffffff;
  z-index: 3;
  position: relative;
  text-shadow: 
    0 0 4px rgba(255, 255, 255, 0.9),
    0 0 8px rgba(92, 225, 230, 0.7);
}


  .button:hover {
    transform: scale(1.02);
    box-shadow: 0 0 20px #5ce1e6;
  }

  .button:active {
    transform: scale(0.97);
  }

  .hoverEffect {
    position: absolute;
    bottom: 0;
    top: 0;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
  }

  .hoverEffect div {
    background: linear-gradient(
      90deg,
      #1c56ddff 0%,
      #083c5a 40%,
      #5ce1e6 100%
    );
    border-radius: 40rem;
    width: 8rem;
    height: 8rem;
    transition: 0.4s;
    filter: blur(20px);
    animation: effect infinite 2s linear;
    opacity: 0.5;
  }

  .button:hover .hoverEffect div {
    animation: effect infinite 1s linear;
  }

  @keyframes effect {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes borderShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
`;

export default InsightsButton;
