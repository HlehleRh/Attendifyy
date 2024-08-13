import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ViewModalPage } from './view-modal.page';

describe('ViewModalPage', () => {
  let component: ViewModalPage;
  let fixture: ComponentFixture<ViewModalPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewModalPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
