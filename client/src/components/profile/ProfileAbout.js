import React, {Fragment} from 'react'
import PropTypes from 'prop-types'

const ProfileAbout = ({ profile: {
    bio,
    skills,
    location,
    website,
    user: {name}
}}) => ( <div class="profile-about bg-light p-2">
  <h2 class="text-primary">Agri Products</h2>
  <div class="skills">
  {skills.map((skill, index) => (
      <div key={index} className="p-1">
      <i className='fas fa-seedling'></i> {skill}
      </div>
  ))}
  </div>

  {location && (
    <Fragment>
      <div class="line" />
      <h2 class="text-primary">Address</h2>
      <p><i className='fas fa-map-marker-alt'></i> {location}</p>
    </Fragment>
  )}

  {website && (
    <Fragment>
      <div class="line" />
      <h2 class="text-primary">Contact Number</h2>
      <p><i className='fas fa-phone'></i> {website}</p>
    </Fragment>
  )}

  {bio && (
    <Fragment>
      <div class="line" />
      <h2 class="text-primary">{name.trim().split(' ')[0]}'s Bio</h2>
      <p>
        {bio}
      </p>
    </Fragment>
  )}
</div>
);
ProfileAbout.propTypes = {
    profile: PropTypes.object.isRequired
}

export default ProfileAbout;