import React from 'react';
import {Link} from 'react-router-dom';
import PropTypes from 'prop-types';

const ProfileItem = ({
    profile: {
        user: {_id, name, avatar},
        status,
        company,
        location,
        skills,
        website
},
    auth
}) => {
  return <div className ="profile bg-light">
    <img src={avatar} alt="" className="round-img"/>
    <div>
        <h4 className="text-primary">Farmer Details:</h4>
        <p><strong>{name}</strong></p>
        {website && <p>{website}</p>}
        <p>{status} {company && <span>at {company}</span>}, {location}</p>
        <Link to={`/profile/${_id}`} className='btn btn-primary'>
            View Profile
        </Link>
        {auth.isAuthenticated && !auth.loading && auth.user._id === _id && (
            <Link to='/edit-profile' className='btn btn-dark'>
                Edit Profile
            </Link>
        )}
    </div>
    <div>
        <h4 className="text-primary">Agri Products:</h4>
        <ul>
        {skills.slice(0, 4).map((skill,index) => (
            <li key={index} className='text-primary'>
            {skill}
            </li>
        ))}
        </ul>
    </div>
    </div>;
};

ProfileItem.propTypes = {
    profile: PropTypes.object.isRequired,
    auth: PropTypes.object.isRequired
}

export default ProfileItem;