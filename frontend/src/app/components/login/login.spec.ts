import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component'; // Ruta y nombre de clase corregidos

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // Si es un componente standalone, se incluye en imports
      imports: [LoginComponent] 
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Reemplaza whenStable para inicialización básica
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});