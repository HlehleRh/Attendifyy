import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { NavController, ModalController, AlertController, ToastController } from '@ionic/angular';
import { ViewModalComponent } from '../view-modal/view-modal.component';
import { map } from 'rxjs/operators';
import { DataService } from '../services/data.service';
// import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
// import { BarcodeScanner } from '@capacitor-community/barcode-scanner';

interface UserData {
  name: string;
  surname: string;
  studentNumber: string;
  email: string;
}
@Component({
  selector: 'app-stude-scan',
  templateUrl: './stude-scan.page.html',
  styleUrls: ['./stude-scan.page.scss'],
})
export class StudeScanPage implements OnInit {
  email:string="";
  
student:any;

  @ViewChild('scannerPreview', { static: false })
  scannerPreview!: ElementRef;
  scanResult: string = '';

  
  constructor(
    private firestore: AngularFirestore,
    private auth: AngularFireAuth,
    private navCtrl: NavController,
    private alertController: AlertController,
    private toastController: ToastController,
    private modalController: ModalController,
    private data: DataService
  ) {}

  async ngOnInit() {
    const user = await this.auth.currentUser;

    if (user) {
      const userEmail: string = user.email || '';
      alert(userEmail);
      this.email = userEmail;
      // this.captureAttendies();
      this.searchStudent();
    //   if(this.student){
    //   alert(JSON.stringify(this.student)); 
    // }
    // else{
    //   alert("there is nothing on a object student");
    // }
    }

    
  }
  async presentViewModal() {
    const modal = await this.modalController.create({
      component: ViewModalComponent
    });
    return await modal.present();
  }
  //
  // async presentConfirmationAlert() {
  //   const alert = await this.alertController.create({
  //     header: 'Confirmation',
  //     message: 'Are you sure you want to SIGN OUT?',
  //     buttons: [
  //       {
  //         text: 'Cancel',
  //         role: 'cancel',
  //         cssClass: 'my-custom-alert',
  //         handler: () => {
  //           console.log('Confirmation canceled');
  //         }
  //       },
  //       {
  //         text: 'Confirm',
  //         handler: () => {
  //           this.auth.signOut().then(() => {
  //             this.navCtrl.navigateForward("/login");
  //             this.presentToast('SIGNED OUT!', 'success');
  //           }).catch((error) => {
  //             console.error('Sign out error:', error);
  //             this.presentToast('Error during sign out. Please try again.', 'danger');
  //           });
  //         }
  //       }
  //     ]
  //   });
  //   await alert.present();
  // }

  searchStudent() {
    if (this.email) {
      alert("I am here as " + this.email);
      this.data.getStudentByEmail(this.email).subscribe(data => {
        if (data.length > 0) {

          this.student = data[0]; 
          alert(JSON.stringify(this.student));
        } else {
          alert("Current User not found");
          this.student = null;
        }
      });
    } else {
      alert("Current User not found");
      this.student = null;
    }
  }

  async startScan() {
    const permission = await BarcodeScanner.checkPermission({ force: true });
    if (!permission.granted) {
      this.scanResult = 'Camera permission is not granted';

      this.CaptureAttendiesDetails();
      return;
    }

    BarcodeScanner.hideBackground(); 
    const result = await BarcodeScanner.startScan();

    if (result.hasContent) {
      this.scanResult = result.content; // Process the scan result
      this.CaptureAttendiesDetails(this.scanResult);
      
    } else {
      this.scanResult = 'No content found';
    }

    BarcodeScanner.showBackground(); // Make the background of WebView visible again
  }

  stopScan() {
    BarcodeScanner.stopScan();
    BarcodeScanner.showBackground(); // Make the background of WebView visible again
  }

  async CaptureAttendiesDetails(moduleCode:string = "SS01"){

         alert(JSON.stringify(this.student));
        
        const date = new Date();
        const dateString = date.toDateString();

        const attendanceDetails = {
          email: this.student.email,
          name: this.student.name,
          surname:this.student.surname,
          studentNumber: this.student.studentNumber,
          scanDate: dateString,
          module: moduleCode
        };

        await this.firestore.collection('AttendedStudents').doc(moduleCode).collection(attendanceDetails.scanDate).doc(this.email).set(attendanceDetails);
        console.log('Attendance stored successfully.');





  }
   
}






































































































































































//   async presentViewModal() {
//     const modal = await this.modalController.create({
//       component: ViewModalComponent
//     });
//     return await modal.present();
//   }
  
  
//   async scanBarcode() {
//     try {
//       // Ensure the scanner uses the rear camera
//       // const permission=await BarcodeScanner.checkPermission({ force: true });

//       // if(!permission){
//       //   alert("Permission not granded");
//       // }

//       // const result = await BarcodeScanner.startScan();

//       // const result = "CF100";
//       // if (result.hasContent) {
//       //   console.log('Scanned data:', result.content);


//         const user = await this.auth.currentUser;

//         if (!user) {
//           console.error('User not logged in.');
//           return;
//         }

//         const userId: string = user.email || '';

//         // const qrCodeData = JSON.parse(result.content);

//         // if (!qrCodeData || !qrCodeData.moduleName) {
//         //   console.error('QR code data does not contain a valid module name.');
//         //   return;
//         // }

//         // Fetch user data from registeredStudents collection
//         // const userDoc: AngularFirestoreDocument<UserData> = this.firestore.collection('registeredStudents').doc(userId);
//         // const userDocSnapshot = await userDoc.get().toPromise();
        
//         // if (!userDocSnapshot || !userDocSnapshot.exists) {
//         //   console.error('No user data found.');
//         //   return;
//         // }

//         // const userData = userDocSnapshot.data();

//         // alert(JSON.stringify(userData));
        
//         // if (!userData) {
//         //   console.error('User data is empty.');
//         //   return;
//         // }

//         // const moduleName = qrCodeData.moduleName


//         const moduleCode = "IS200";

//          alert(JSON.stringify(this.student));

//         const attendanceDetails = {
//           email: this.student.email,
//           name: this.student.name,
//           surname:this.student.surname,
//           studentNumber: this.student.studentNumber,
//           scanDate: new Date(),
//           module: moduleCode
//         };

//         // await this.firestore.collection('AttendedStudents').doc(qrCodeData).doc(userId).set(attendanceDetails);
//         await this.firestore.collection('AttendedStudents').doc(moduleCode).collection(this.email).doc().set(attendanceDetails);
//         console.log('Attendance stored successfully.');

//         this.presentToast('Attendance recorded successfully.', 'success');
//       // } else {
//       //   console.error('No barcode data found.');
//       // }
//     } catch (error) {
//       console.error('Barcode scanning error:', error);
//       this.presentToast('Error during scanning. Please try again.', 'danger');
//     }
//   }

//   // async presentConfirmationAlert() {
//   //   const alert = await this.alertController.create({
//   //     header: 'Confirmation',
//   //     message: 'Are you sure you want to SIGN OUT?',
//   //     buttons: [
//   //       {
//   //         text: 'Cancel',
//   //         role: 'cancel',
//   //         cssClass: 'my-custom-alert',
//   //         handler: () => {
//   //           console.log('Confirmation canceled');
//   //         }
//   //       },
//   //       {
//   //         text: 'Confirm',
//   //         handler: () => {
//   //           this.auth.signOut().then(() => {
//   //             this.navCtrl.navigateForward("/login");
//   //             this.presentToast('SIGNED OUT!', 'success');
//   //           }).catch((error) => {
//   //             console.error('Sign out error:', error);
//   //             this.presentToast('Error during sign out. Please try again.', 'danger');
//   //           });
//   //         }
//   //       }
//   //     ]
//   //   });
//   //   await alert.present();
//   // }

//   async presentToast(message: string, color: string) {
//     const toast = await this.toastController.create({
//       message:message,
//       duration: 2000,
//       position: 'top',
//       color:color,
//     });

//     await toast.present();
//   }




//   }

