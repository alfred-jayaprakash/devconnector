import React, {Fragment} from 'react';
import {Link} from 'react-router-dom';

class Login extends React.Component {
  constructor (props) {
    super (props);
    this.state = {
      email: '',
      password: '',
    };

    this.handleChange = this.handleChange.bind (this);
    this.handleSubmit = this.handleSubmit.bind (this);
  }

  handleChange (event) {
    this.setState ({[event.target.name]: event.target.value});
  }

  handleSubmit (event) {
    event.preventDefault ();
    console.log ('SUCCESS');
  }

  render () {
    return (
      <Fragment>
        <section className="container">
          <h1 className="large text-primary">Sign In</h1>
          <p className="lead">
            <i className="fas fa-user" />Sign Into Your Account
          </p>
          <form className="form" onSubmit={this.handleSubmit}>
            <div className="form-group">
              <input
                type="email"
                placeholder="Email Address"
                name="email"
                value={this.state.email}
                onChange={this.handleChange}
                required
              />
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
            <input type="submit" className="btn btn-primary" value="Login" />
          </form>
          <p className="my-1">
            Dont' have an account? <Link to="/register">Register</Link>
          </p>
        </section>
      </Fragment>
    );
  }
}

export default Login;
