import shared from '@commons/shared.module.css';

export default function DeleteBtn({ onClick }) {
  return (
    <button className={shared.btnDelete} onClick={onClick} title='삭제'>
      <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='#ef4444' strokeWidth='2'>
        <polyline points='3 6 5 6 21 6' />
        <path d='M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2' />
      </svg>
    </button>
  );
}
