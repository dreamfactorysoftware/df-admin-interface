import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { USER_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { userResolver, usersResolver } from './users.resolver';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { UserProfile } from 'src/app/shared/types/user';
import { GenericListResponse } from 'src/app/shared/types/generic-http.type';

const mockUserProfile = {
  username: 'admin@test.com',
  firstName: 'admin',
  lastName: 'test',
  name: 'admin test',
  email: 'admin@test.com',
  phone: '1234567890',
  securityQuestion: null,
  defaultAppId: null,
  oauthProvider: '',
  adldap: '',
};

const mockUserService = {
  get: jest.fn().mockReturnValue(of(mockUserProfile)),
  getAll: jest.fn().mockReturnValue(of({ data: [mockUserProfile], total: 1 })),
};

describe('User Resolvers', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: USER_SERVICE_TOKEN, useValue: mockUserService }],
    });
  });

  describe('userResolver', () => {
    it('should return user profile if id is present', () => {
      const mockRoute = { paramMap: { get: () => '123' } } as any;
      const result = TestBed.runInInjectionContext(() =>
        userResolver(mockRoute, {} as RouterStateSnapshot)
      );
      (result as Observable<UserProfile>).subscribe(user => {
        expect(user).toEqual(mockUserProfile);
      });
    });

    it('should return undefined if id is not present', () => {
      const mockRoute = { paramMap: { get: () => undefined } } as any;
      const result = TestBed.runInInjectionContext(() =>
        userResolver(mockRoute, {} as RouterStateSnapshot)
      );
      expect(result).toBeUndefined();
    });
  });

  describe('usersResolver', () => {
    it('should return list of users', () => {
      const result = TestBed.runInInjectionContext(() =>
        usersResolver()({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
      );
      (result as Observable<GenericListResponse<UserProfile>>).subscribe(
        users => {
          expect(users).toEqual({ data: [mockUserProfile], total: 1 });
        }
      );
    });
  });
});
