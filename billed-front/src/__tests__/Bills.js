/**
 * @jest-environment jsdom
 */

import { screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import Bills from "../containers/Bills.js"
import { ROUTES_PATH} from "../constants/routes.js";
import { ROUTES } from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import router from "../app/Router.js";

jest.mock("../app/Store", () => mockStore)

describe("Given I am connected as an employee", () => {
    describe("When I am on Bills Page", () => {
      let billsPage;
      beforeEach(() => {
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee'
        }))
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.append(root)
        router()
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }
        billsPage = new Bills({
          document,
          onNavigate,
          store: mockStore,
          localStorage: localStorageMock
      });
    })

    test("Then bill icon in vertical layout should be highlighted", async () => {
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      expect(windowIcon.className).toEqual('active-icon')
    })

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    test("Then clicking on the new bill button should lead to the 'New Bill' page", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const handleClickNewBill = jest.fn(billsPage.handleClickNewBill);
      const buttonNewBill = screen.getByTestId("btn-new-bill");
      buttonNewBill.addEventListener("click", handleClickNewBill)
      buttonNewBill.click()
      expect(handleClickNewBill).toHaveBeenCalled();
      expect(screen.getByText("Envoyer une note de frais")).toBeTruthy();
    });

    test('Then should return unformatted date for a bill with a corrupted date', async () => {
      const bill = [{ id: 'bill1', date: 'invalid date', status: 'pending' }]
      billsPage = new Bills({
        document,
        onNavigate,
        store: {
          bills: () => ({
            list: () => Promise.resolve(bill)
          })
        },
        localStorage: localStorageMock
      })
      const result = await billsPage.getBills()
      expect(result).toEqual([{ id: 'bill1', date: 'invalid date', status: 'En attente' }])
    })
    
    describe("When I click on the icon eye", () => {
      test("Then a modal should open and handleClickIconEye should be called", () => {
        document.body.innerHTML = BillsUI({ data: bills })
        billsPage = new Bills({
          document,
          onNavigate,
          store: mockStore,
          localStorage: localStorageMock
        });
        $.fn.modal = jest.fn();
        const iconEye = screen.getAllByTestId('icon-eye')[0]
        const handleClickIconEyeSpy = jest.spyOn(billsPage, 'handleClickIconEye')
        iconEye.click()
        expect(handleClickIconEyeSpy).toHaveBeenCalled()
        const altImgModal = screen.getByAltText('Bill')
        expect(altImgModal).toBeTruthy()
      })
    })
  })
})
// test d'intégration GET
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills page", () => {
    test("fetches bills from mock API GET", async () => {
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      const buttonNewBill = screen.getByTestId("btn-new-bill");
      expect(buttonNewBill).toBeTruthy();
    })

    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills")
        Object.defineProperty(
            window,
            'localStorage',
            { value: localStorageMock }
        )
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee',
          email: "a@a"
        }))
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.appendChild(root)
        router()
      })

      test("fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list : () =>  {
              return Promise.reject(new Error("Erreur 404"))
            }
          }
        })
        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 404/)
        expect(message).toBeTruthy()
      })

      test("fetches messages from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list : () =>  {
              return Promise.reject(new Error("Erreur 500"))
            }
          }
        })
        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 500/)
        expect(message).toBeTruthy()
      })
    })
  })
})

