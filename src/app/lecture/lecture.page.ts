import { Component, OnInit } from '@angular/core';
import { NavController, LoadingController, AlertController, ToastController } from '@ionic/angular';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import firebase from 'firebase/compat/app'; // Import firebase app
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject } from 'rxjs';


@Component({
  selector: 'app-lecture',
  templateUrl: './lecture.page.html',
  styleUrls: ['./lecture.page.scss'],
})
export class LecturePage implements OnInit {
  showAddCard: boolean = false;

  contact_nom: string = '';
  contact_email: string = '';
  contact_sujet: string = '';
  contact_message: string = '';

  moduleName: any;
  moduleCode: any;
  moduleLevel: any;
  userData: any;
  tableData: any[] = [];
  selectedModuleId: string | null = null; // Store selected module ID
  navController: NavController;

  showAddStudentsModal: boolean = false;
  registeredStudents: any[] = [];
  filteredStudents: any[] = [];
  selectedModule: any;
  searchTerm: string = '';
  searchTerms = new Subject<string>();
  existingStudents: Set<string> = new Set();

  constructor(
    private router: Router,
    private navCtrl: NavController,
    private loadingController: LoadingController,
    private auth: AngularFireAuth,
    private db: AngularFirestore,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    this.navController = navCtrl;
    this.searchTerms.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      this.searchStudents(term);
    });
  }

  async openAddStudentsModal() {
    if (!this.selectedModuleId) {
      alert('Please select a module first.');
      return;
    }

    this.showAddStudentsModal = true;
    this.selectedModule = this.tableData.find(module => module.id === this.selectedModuleId);
    await this.fetchExistingStudents();
    await this.fetchRegisteredStudents();
  }

  closeAddStudentsModal() {
    this.showAddStudentsModal = false;
    this.searchTerm = '';
    this.filteredStudents = [];
    this.registeredStudents = [];
    this.existingStudents.clear();
  }

  async fetchExistingStudents() {
    try {
      const snapshot = await firebase.firestore()
        .collection('allModules')
        .doc(this.selectedModule.moduleCode)
        .collection(this.selectedModule.moduleName)
        .get();
      
      this.existingStudents = new Set(snapshot.docs.map(doc => doc.id));
    } catch (error) {
      console.error('Error fetching existing students:', error);
    }
  }

  async fetchRegisteredStudents() {
    try {
      const snapshot = await this.db.collection('registeredStudents').get().toPromise();
      if (snapshot) {
        this.registeredStudents = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...(doc.data() as { email: string; name: string; surname: string; studentNumber: string }),
            selected: false
          }))
          .filter(student => !this.existingStudents.has(student.id)); // Filter out existing students
        this.filteredStudents = [...this.registeredStudents];
      } else {
        this.registeredStudents = [];
        this.filteredStudents = [];
      }
    } catch (error) {
      console.error('Error fetching registered students:', error);
      alert('An error occurred while fetching registered students.');
    }
  }

  searchStudents(term: string) {
    this.searchTerm = term;
    if (!term) {
      this.filteredStudents = [...this.registeredStudents];
    } else {
      const lowerCaseSearch = term.toLowerCase();
      this.filteredStudents = this.registeredStudents.filter(student => 
        student.studentNumber.toLowerCase().includes(lowerCaseSearch) ||
        student.name.toLowerCase().includes(lowerCaseSearch) ||
        student.surname.toLowerCase().includes(lowerCaseSearch)
      );
    }
  }

  onSearchInput(event: any) {
    this.searchTerms.next(event.target.value);
  }

  async confirmAddStudents() {
    const selectedStudents = this.filteredStudents.filter(student => student.selected);
    
    if (selectedStudents.length === 0) {
      alert('Please select at least one student.');
      return;
    }
  
    try {
      const batch = firebase.firestore().batch();
      const moduleRef = firebase.firestore().collection('allModules').doc(this.selectedModule.moduleCode);
      const studentsRef = moduleRef.collection(this.selectedModule.moduleName);
  
      const enrolledModulesRef = firebase.firestore().collection('enrolledModules');
  
      for (const student of selectedStudents) {
        const studentDocRef = studentsRef.doc(student.id);
        batch.set(studentDocRef, {
          email: student.email,
          name: student.name,
          surname: student.surname,
          studentNumber: student.studentNumber,
          moduleCode: this.selectedModule.moduleCode
        });
  
        // Use studentNumber as document ID in 'enrolledModules'
        const enrolledStudentDocRef = enrolledModulesRef.doc(student.studentNumber.toString());
        const enrolledStudentDoc = await enrolledStudentDocRef.get();
        
        if (enrolledStudentDoc.exists) {
          // Student exists, update the moduleCode array
          const enrolledStudentData = enrolledStudentDoc.data();
          if (enrolledStudentData) {
            const existingModuleCodes = enrolledStudentData['moduleCode'] || [];
            if (!existingModuleCodes.includes(this.selectedModule.moduleCode)) {
              existingModuleCodes.push(this.selectedModule.moduleCode);
              batch.update(enrolledStudentDocRef, { moduleCode: existingModuleCodes });
            }
          }
        } else {
          // Student does not exist, create a new document
          batch.set(enrolledStudentDocRef, {
            email: student.email,
            name: student.name,
            surname: student.surname,
            studentNumber: student.studentNumber,
            moduleCode: [this.selectedModule.moduleCode]
          });
        }
      }
  
      await batch.commit();
      alert('Students successfully added to the module.');
      this.closeAddStudentsModal();
    } catch (error) {
      console.error('Error adding students to module:', error);
      alert('An error occurred while adding students to the module.');
    }
  }
  


  ngOnInit() {
    this.auth.onAuthStateChanged((user) => {
      if (user && user.email) {
        this.getData(user.email);
      } else {
        console.log('User not logged in or email is null.');
      }
    });
  }

  async presentConfirmationAlert() {
    const alert = await this.alertController.create({
      header: 'Confirmation',
      message: 'Are you sure you want to SIGN OUT?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'my-custom-alert',
          handler: () => {
            console.log('Confirmation canceled');
          },
        },
        {
          text: 'Confirm',
          handler: () => {
            this.auth
              .signOut()
              .then(() => {
                this.navController.navigateForward('/login');
                this.presentToast();
              })
              .catch((error) => {
                console.error('Sign out error:', error);
              });
          },
        },
      ],
    });
    await alert.present();
  }

  async presentToast() {
    const toast = await this.toastController.create({
      message: 'SIGNED OUT!',
      duration: 1500,
      position: 'top',
    });
    await toast.present();
  }

  async addModule() {
    const loader = await this.loadingController.create({
      message: 'Submitting...',
      cssClass: 'custom-loader-class',
    });
    await loader.present();

    try {
      const user = firebase.auth().currentUser;

      if (user && user.email) {
        await this.db.collection('modules').add({
          moduleName: this.moduleName,
          moduleCode: this.moduleCode,
          moduleLevel: this.moduleLevel,
          userEmail: user.email,
        });

        this.moduleName = '';
        this.moduleCode = '';
        this.moduleLevel = '';

        loader.dismiss();
        alert('Module successfully saved');
        this.getData(user.email); // Refresh the module list
      } else {
        loader.dismiss();
        alert('User not logged in or email is null.');
      }
    } catch (error) {
      loader.dismiss();
      console.error('Error saving module:', error);
      alert('An error occurred while saving the module.');
    }
  }

  async deleteModule() {
    if (!this.selectedModuleId) {
      alert('No module selected for deletion.');
      return;
    }

    const loader = await this.loadingController.create({
      message: 'Deleting...',
      cssClass: 'custom-loader-class',
    });
    await loader.present();

    try {
      await this.db.collection('modules').doc(this.selectedModuleId).delete();
      alert('Module successfully deleted');
      this.selectedModuleId = null; // Clear the selected module
      const user = firebase.auth().currentUser;
      if (user && user.email) {
        this.getData(user.email); // Refresh the module list
      }
      loader.dismiss();
    } catch (error) {
      loader.dismiss();
      console.error('Error deleting module:', error);
      alert('An error occurred while deleting the module.');
    }
  }

  selectModule(moduleId: string) {
    this.selectedModuleId = moduleId;
    // Update the table selection
    this.updateTableSelection();
  }

  updateTableSelection() {
    const rows = document.querySelectorAll('tbody tr');
    rows.forEach((row) => {
      const htmlRow = row as HTMLElement;
      if (htmlRow.dataset['id'] === this.selectedModuleId) {
        htmlRow.classList.add('selected');
      } else {
        htmlRow.classList.remove('selected');
      }
    });
  }

  gotoQRscan(moduleCode: string) {
    this.router.navigate(['qr-scan'], { queryParams: { moduleCode } });
  }

  gotoProfile() {
    this.router.navigate(['profile']);
  }

  gotoAttendies() {
    this.router.navigate(['attendies']);
  }

  viewStudents() {
    this.router.navigate(['/view-students']);
  }


  
  getData(userEmail: string) {
    this.db
      .collection('modules', (ref) => ref.where('userEmail', '==', userEmail))
      .snapshotChanges()
      .subscribe((data) => {
        this.userData = data.map((d) => {
          const id = d.payload.doc.id;
          const docData = d.payload.doc.data() as any;
          return { id, ...docData };
        });
        console.log(this.userData);
        this.tableData = this.userData;
        // Update the table selection after data is loaded
        this.updateTableSelection();
      });
  }
}