/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom"
import NewBill from "../containers/NewBill.js"
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from '../__mocks__/store.js'
import { ROUTES_PATH} from "../constants/routes.js";
import { ROUTES } from "../constants/routes.js";
import router from "../app/Router.js";
import NewBillUI from "../views/NewBillUI.js";

describe("Given I am connected as an employee", () => {
  let newBills;
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
      })
    );
    const root = document.createElement("div")
    root.setAttribute("id", "root")
    document.body.append(root)
    router()
    document.body.innerHTML = NewBillUI()
    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname })
    }
    newBills = new NewBill({
      document,
      onNavigate,
      store: mockStore,
      localStorage: localStorageMock
    });
  })
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("When I am on NewBill Page", () => {
    test("Then mail icon in vertical layout should be highlighted", async () => {
      window.onNavigate(ROUTES_PATH.NewBill)
      await waitFor(() => screen.getByTestId('icon-mail'))
      const mailIcon = screen.getByTestId('icon-mail')
      expect(mailIcon.className).toEqual('active-icon')
    })
    
    describe('When I selected a file in the form', () => {
      test('Then I selected a file with allowed extensions', async (done) => {
        const file = new File(
          ["valid_file.png"],
          "valid_file.png",
          { type: "image/png" }
        );
        const handleChangeFile = jest.fn(async (e) => {
          e.preventDefault();
          await newBills.handleChangeFile(e)
          done()
        })
        const fileInput = screen.getByTestId("file");
        fileInput.addEventListener("change", handleChangeFile);
        fireEvent.change(fileInput, { target: { files: [file] } });
        expect(handleChangeFile).toHaveBeenCalled()
        expect(fileInput.files[0]).toBe(file)
      })

      test('Then I selected a file with not allowed extensions', async () => {
        const file = new File(
          ["invalid_file.txt"],
          "invalid_file.txt",
          { type: "text/plain" }
        );
        const handleChangeFile = jest.fn(async (e) => {
          e.preventDefault();
          await newBills.handleChangeFile(e)
        })    
        const fileInput = screen.getByTestId("file");
        fileInput.addEventListener("change", handleChangeFile);
        fireEvent.change(fileInput, { target: { files: [file] } });
        expect(handleChangeFile).toHaveBeenCalled()
        const errFeedback = screen.getByTestId('errorFile')
        expect(errFeedback.textContent).toBe('Please upload a file with a valid extension: jpg, jpeg or png')
        expect(handleChangeFile).toHaveBeenCalled()
      })

    test('Then error Api create file', async () => {
        const file = new File(
          ["invalid_file.txt"],
          "invalid_file.txt",
          { type: "text/plain" }
        );
        const errorMessage = 'Erreur File'
        const fileInput = screen.getByTestId("file");
        const fileMockError = jest.spyOn(mockStore.bills(), "create").mockRejectedValueOnce(new Error(errorMessage));
        const consoleErrorMock = jest.spyOn(console, "error").mockImplementation();
        fileInput.addEventListener("change", fileMockError);
        fireEvent.change(fileInput, { target: { files: [file] } });
        expect(fileMockError).toHaveBeenCalled()
        await new Promise(process.nextTick);
        expect(consoleErrorMock).toHaveBeenCalledWith(new Error(errorMessage))
      })
    })

    describe('When I fill data and submit  form newBill', () => {
      test('Then I submit form should lead to the bills page', () => {
        const handleSubmit = jest.fn(() => newBills.handleSubmit);
        const form = screen.getByTestId('form-new-bill');
        form.addEventListener("submit", handleSubmit);
        fireEvent.submit(form)
        expect(handleSubmit).toHaveBeenCalled()
        expect(screen.getByText("Mes notes de frais")).toBeTruthy();
      });    
    
      test("Then the store should be updated with the given bill object and selector, and the page should navigate to Bills after the update is successful", async () => {
        const mockUpdate = jest.spyOn(mockStore.bills(), "update");
        const onNavigate = jest.fn();
        newBills.onNavigate = onNavigate;
        const bill = {
          email: "john.doe@example.com",
          type: "Hotel",
          name: "Hotel stay",
          amount: 120,
          date: "2023-04-25",
          vat: "20%",
          pct: 20,
          commentary: "Nice stay",
          fileUrl: "https://example.com/bills/hotel_stay.jpg",
          fileName: "hotel_stay.jpg",
          status: "pending"
        };
        newBills.billId = "abc123";
        await newBills.updateBill(bill);
        expect(mockUpdate).toHaveBeenCalledWith({
          data: JSON.stringify(bill),
          selector: "abc123"
        });
        expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH.Bills);
      })
      test('Then I POST a new bill i expect add to bills list ', () => {
        const updateMock = jest.spyOn(mockStore.bills(), "update")
        const form = screen.getByTestId('form-new-bill');
        fireEvent.submit(form)
        expect(updateMock).toHaveBeenCalled()
      });
      test('Then I POST a new bill i expect add to bills list and fail with error 404', async () => {
        const errorMessage = 'Erreur 404'
        const handleSubmit = jest.fn(() => newBills.handleSubmit);
        const updateMockError = jest.spyOn(mockStore.bills(), "update").mockRejectedValueOnce(new Error(errorMessage));
        const consoleErrorMock = jest.spyOn(console, "error").mockImplementation();
        const form = screen.getByTestId('form-new-bill');
        form.addEventListener("submit", handleSubmit);
        fireEvent.submit(form)
        expect(updateMockError).toHaveBeenCalled()
        await new Promise(process.nextTick);
        expect(consoleErrorMock).toHaveBeenCalledWith(new Error(errorMessage))
      });
      test('Then I POST a new bill i expect add to bills list and fail with error 500', async () => {
        const errorMessage = 'Erreur 500'
        const handleSubmit = jest.fn(() => newBills.handleSubmit);
        const updateMockError = jest.spyOn(mockStore.bills(), "update").mockRejectedValueOnce(new Error(errorMessage));
        const consoleErrorMock = jest.spyOn(console, "error").mockImplementation();
        const form = screen.getByTestId('form-new-bill');
        form.addEventListener("submit", handleSubmit);
        fireEvent.submit(form)
        expect(updateMockError).toHaveBeenCalled()
        await new Promise(process.nextTick);
        expect(consoleErrorMock).toHaveBeenCalledWith(new Error(errorMessage))
      });
    });
  })
});