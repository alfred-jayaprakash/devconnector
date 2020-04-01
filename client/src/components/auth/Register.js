import React, {Fragment} from 'react';
import {Link} from 'react-router-dom';
import axios from 'axios';
import {connect} from 'react-redux';
import {setAlert} from '../../actions/alert';
import PropTypes from 'prop-types';

class Register extends React.Component {
  constructor (props) {
    super (props);
    this.state = {
      name: '',
      email: '',
      password: '',
      password2: '',
    };

    this.handleChange = this.handleChange.bind (this);
    this.handleSubmit = this.handleSubmit.bind (this);
  }

  handleChange (event) {
    this.setState ({[event.target.name]: event.target.value});
  }

  async handleSubmit (event) {
    event.preventDefault ();
    const name = this.state.name;
    const email = this.state.email;
    const password = this.state.password;
    const password2 = this.state.password2;

    if (password !== password2) {
      this.props.setAlert ('Passwords do not match', 'danger');
    } else {
      const newUser = {
        name,
        email,
        password,
      };

      try {
        const config = {
          headers: {
            'Content-Type': 'application/json',
          },
        };

        const body = JSON.stringify (newUser);

        const res = await axios.post ('/api/users', body, config);
        console.log (res.data);
      } catch (err) {
        console.error (err.response.data);
      }
    }
  }

  render () {
    return (
      <Fragment>
        <section className="container">
          <h1 className="large text-primary">Sign Up</h1>
          <p className="lead">
            <i className="fas fa-user" /> Create Your Account
          </p>
          <form className="form" onSubmit={this.handleSubmit}>
            <div className="form-group">
              <input
                type="text"
                placeholder="Name"
                name="name"
                value={this.state.name}
                onChange={this.handleChange}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="email"
                placeholder="Email Address"
                name="email"
                value={this.state.email}
                onChange={this.handleChange}
                required
              />
              <small className="form-text">
                This site uses Gravatar so if you want a profile image, use a
                Gravatar email
              </small>
            </div>
            <div className="form-group">
              <input
                type="password"
                placeholder="Password"
                name="password"
                value={this.state.password}
                onChange={this.handleChange}
                required
                minLength="6"
              />
            </div>
            <div className="form-group">
              <input
                type="password"
                placeholder="Confirm Password"
                name="password2"
                value={this.state.password2}
                onChange={this.handleChange}
                required
                minLength="6"
              />
            </div>
            <input type="submit" className="btn btn-primary" value="Register" />
          </form>
          <p className="my-1">
            Already have an account? <Link to="/login">Sign In</Link>
          </p>
        </section>
      </Fragment>
    );
  }
}

Register.propTypes = {
  setAlert: PropTypes.func.isRequired,
};

export default connect (null, {setAlert}) (Register);
