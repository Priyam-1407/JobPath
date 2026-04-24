from flask import Flask, render_template, redirect, url_for, request, flash, jsonify
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from models import db, User, UserSkill
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'super-secret-jobpath-key'
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'jobpath.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

login_manager = LoginManager()
login_manager.login_view = 'login'
login_manager.init_app(app)

@login_manager.user_loader
def load_user(id):
    return User.query.get(int(id))

@app.route('/')
def home():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    return render_template('home.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        user = User.query.filter_by(username=username).first()
        if user and user.check_password(password):
            login_user(user)
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid username or password', 'danger')
            
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
        
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        user = User.query.filter_by(username=username).first()
        if user:
            flash('Username already exists', 'danger')
            return redirect(url_for('register'))
            
        new_user = User(username=username)
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()
        
        login_user(new_user)
        return redirect(url_for('dashboard'))
        
    return render_template('register.html')

@app.route('/dashboard')
@login_required
def dashboard():
    roles = ["Data Scientist", "Web Developer", "Data Analyst", "ML Engineer", "Backend Developer", "Frontend Developer"]
    return render_template('dashboard.html', target_role=current_user.target_role, roles=roles)

@app.route('/add-skill', methods=['POST'])
@login_required
def add_skill():
    skill_name = request.form.get('skill_name')
    proficiency = request.form.get('proficiency')
    
    if skill_name and proficiency:
        # Check if the skill already exists for the user to avoid duplicates if desired,
        # but for simplicity we'll just add it or overwrite via an update.
        existing_skill = UserSkill.query.filter_by(user_id=current_user.id, skill_name=skill_name).first()
        if existing_skill:
            existing_skill.proficiency = int(proficiency)
            flash(f'Updated {skill_name} proficiency.', 'info')
        else:
            new_skill = UserSkill(user_id=current_user.id, skill_name=skill_name, proficiency=int(proficiency))
            db.session.add(new_skill)
            flash(f'Skill {skill_name} added successfully.', 'success')
        db.session.commit()

    return redirect(url_for('dashboard'))

@app.route('/delete-skill/<int:skill_id>', methods=['POST', 'GET'])
@login_required
def delete_skill(skill_id):
    skill = UserSkill.query.get_or_404(skill_id)
    if skill.user_id == current_user.id:
        db.session.delete(skill)
        db.session.commit()
        flash('Skill deleted from your profile', 'success')
    return redirect(url_for('dashboard'))

@app.route('/api/get-user-skills', methods=['GET'])
@login_required
def get_user_skills():
    skills = UserSkill.query.filter_by(user_id=current_user.id).all()
    skills_data = [{"id": s.id, "skill_name": s.skill_name, "proficiency": s.proficiency} for s in skills]
    return jsonify(skills_data)

@app.route('/api/save-target-role', methods=['POST'])
@login_required
def save_target_role():
    data = request.get_json()
    role = data.get('role')
    if role:
        current_user.target_role = role
        db.session.commit()
        return jsonify({"success": True, "message": "Target role saved"})
    return jsonify({"success": False, "message": "Invalid role"}), 400

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('home'))

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
