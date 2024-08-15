import React from 'react';
import Button from '../../Common/Button';

const UserList = props => {
  const { users, selectedUser, selectUser } = props;
  if (!users) return null;

  const _selectUser = u => {
    selectUser(u);
  };

  return (
    <ul className='u-list'>
      {users.map((u, i) => {
        const isSelected = selectedUser?.id === u.id;
        const isOnline = u.online ? true : false;

        return (
          <li className={isSelected ? 'selected' : 'not-selected'} key={i}>
            <Button
              variant='none'
              borderless
              text={u.name}
              onClick={() => _selectUser(u)}
              // disabled={!isOnline}
              iconDirection='right'
              icon={
                <span
                  className={`circle ${isOnline ? 'online' : 'offline'}`}
                ></span>
              }
            />
          </li>
        );
      })}
    </ul>
  );
};

export default UserList;
